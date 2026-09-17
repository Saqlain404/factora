"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  dbErrorMessage,
  fail,
  ok,
  zodErrorMessage,
  type ActionResult,
} from "@/lib/action-result";
import { idSchema } from "@/lib/validators";
import { generateCode } from "@/lib/business-codes";
import { addLedgerMovement } from "@/modules/inventory/movements";
import { purchaseOrders, purchaseOrderItems, purchaseReceipts } from "./schema";
import { isReceivableStatus } from "./queries";
import {
  purchaseOrderInputSchema,
  purchaseReceiptInputSchema,
  type PurchaseOrderInput,
  type PurchaseReceiptInput,
} from "./schemas";

export async function createPurchaseOrder(
  input: PurchaseOrderInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = purchaseOrderInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  const poNo = generateCode("PO");

  try {
    await db.transaction(async (tx) => {
      await tx.insert(purchaseOrders).values({
        id,
        poNo,
        supplierId: data.supplierId,
        orderDate: data.orderDate ? new Date(`${data.orderDate}T00:00:00`) : new Date(),
        notes: data.notes,
      });
      await tx.insert(purchaseOrderItems).values(
        data.items.map((item) => ({
          id: randomUUID(),
          poId: id,
          rawMaterialId: item.rawMaterialId,
          qty: item.qty,
          rate: item.rate ?? null,
          gstRate: item.gstRate ?? null,
        }))
      );
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "purchase order"));
  }

  revalidatePath("/procurement/purchase-orders");
  return ok({ id });
}

export async function confirmPurchaseOrder(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid purchase order id");

  const [order] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, parsed.data))
    .limit(1);
  if (!order) return fail("Purchase order not found");
  if (order.status !== "draft") return fail("Only draft orders can be confirmed");

  await db
    .update(purchaseOrders)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(purchaseOrders.id, parsed.data));

  revalidatePath("/procurement/purchase-orders");
  revalidatePath(`/procurement/purchase-orders/${parsed.data}`);
  return ok({ id: parsed.data });
}

export async function recordPurchaseReceipt(
  input: PurchaseReceiptInput
): Promise<ActionResult<{ poId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = purchaseReceiptInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, data.poId))
        .limit(1);
      if (!order) return { ok: false as const, error: "Purchase order not found" };
      if (!isReceivableStatus(order.status)) {
        return {
          ok: false as const,
          error: "Purchase order must be confirmed before receiving",
        };
      }

      const [orderItems, existingReceipts] = await Promise.all([
        tx
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.poId, data.poId)),
        tx
          .select()
          .from(purchaseReceipts)
          .where(eq(purchaseReceipts.poId, data.poId)),
      ]);

      const orderedByMaterial = new Map<string, number>();
      for (const item of orderItems) {
        orderedByMaterial.set(
          item.rawMaterialId,
          (orderedByMaterial.get(item.rawMaterialId) ?? 0) + item.qty
        );
      }
      const receivedByMaterial = new Map<string, number>();
      for (const receipt of existingReceipts) {
        receivedByMaterial.set(
          receipt.rawMaterialId,
          (receivedByMaterial.get(receipt.rawMaterialId) ?? 0) + receipt.qty
        );
      }

      const receivedAt =
        data.receivedAt && data.receivedAt.length > 0
          ? new Date(`${data.receivedAt}T00:00:00`)
          : new Date();
      const billDate =
        data.billDate && data.billDate.length > 0
          ? new Date(`${data.billDate}T00:00:00`)
          : null;

      for (const line of data.lines) {
        if (!orderedByMaterial.has(line.rawMaterialId)) {
          return {
            ok: false as const,
            error: `One of the received items is not on this purchase order`,
          };
        }
        const remaining =
          (orderedByMaterial.get(line.rawMaterialId) ?? 0) -
          (receivedByMaterial.get(line.rawMaterialId) ?? 0);
        if (line.qty > remaining) {
          return {
            ok: false as const,
            error: `Receiving ${line.qty} exceeds the outstanding quantity (${remaining}) for an item`,
          };
        }

        const movement = await addLedgerMovement(tx, {
          rawMaterialId: line.rawMaterialId,
          qty: line.qty,
          type: "PURCHASE_RECEIPT",
          referenceType: "purchase_receipt",
          userId: session.user.id,
        });
        if (!movement.ok) return { ok: false as const, error: movement.error };

        await tx.insert(purchaseReceipts).values({
          id: randomUUID(),
          poId: data.poId,
          rawMaterialId: line.rawMaterialId,
          qty: line.qty,
          rate: line.rate ?? 0,
          gstRate: line.gstRate ?? 0,
          billNo: data.billNo,
          billDate,
          receivedAt,
          userId: session.user.id,
          note: data.note,
        });
      }

      const fullyReceived = orderItems.every((item) => {
        const ordered = orderedByMaterial.get(item.rawMaterialId) ?? 0;
        const receivedTotal =
          (receivedByMaterial.get(item.rawMaterialId) ?? 0) +
          data.lines
            .filter((line) => line.rawMaterialId === item.rawMaterialId)
            .reduce((total, line) => total + line.qty, 0);
        return receivedTotal >= ordered;
      });

      await tx
        .update(purchaseOrders)
        .set({
          status: fullyReceived ? "closed" : "received",
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, data.poId));

      return { ok: true as const, poId: data.poId };
    });

    if (!result.ok) return fail(result.error);

    revalidatePath("/procurement/receipts");
    revalidatePath("/procurement/purchase-orders");
    revalidatePath(`/procurement/purchase-orders/${result.poId}`);
    revalidatePath("/inventory/raw-materials");
    return ok({ poId: result.poId });
  } catch (error) {
    return fail(dbErrorMessage(error, "purchase receipt"));
  }
}