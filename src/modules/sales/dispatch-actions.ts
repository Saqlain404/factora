"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import {
  dbErrorMessage,
  fail,
  ok,
  zodErrorMessage,
  type ActionResult,
} from "@/lib/action-result";
import {
  createDispatchInputSchema,
  updateDispatchStatusInputSchema,
  cancelDispatchInputSchema,
  type CreateDispatchInput,
  type UpdateDispatchStatusInput,
} from "./dispatch-schemas";
import { getNextDispatchNumber } from "./dispatch-queries";
import {
  dispatches,
  dispatchItems,
  salesOrders,
  salesOrderItems,
} from "./schema";
import { addLedgerMovement } from "@/modules/inventory/movements";

export async function createDispatch(
  input: CreateDispatchInput
): Promise<ActionResult<{ id: string; dispatchNo: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = createDispatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const dispatchNo = await getNextDispatchNumber();

      const [dispatch] = await tx
        .insert(dispatches)
        .values({
          id: randomUUID(),
          dispatchNo,
          soId: data.soId,
          customerId: data.customerId,
          status: "pending",
          dispatchDate: data.dispatchDate ? new Date(data.dispatchDate) : new Date(),
          expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
          vehicleNo: data.vehicleNo ?? null,
          driverName: data.driverName ?? null,
          driverPhone: data.driverPhone ?? null,
          notes: data.notes ?? null,
          createdBy: session.user.id,
        })
        .returning({ id: dispatches.id, dispatchNo: dispatches.dispatchNo });

      for (const item of data.items) {
        await tx.insert(dispatchItems).values({
          id: randomUUID(),
          dispatchId: dispatch.id,
          soItemId: item.soItemId,
          productId: item.productId,
          qty: item.qty,
        });

        await tx
          .update(salesOrderItems)
          .set({
            dispatchedQty: sql`${salesOrderItems.dispatchedQty} + ${item.qty}`,
            updatedAt: new Date(),
          })
          .where(eq(salesOrderItems.id, item.soItemId));
      }

      const soItems = await tx
        .select({
          id: salesOrderItems.id,
          qty: salesOrderItems.qty,
          dispatchedQty: salesOrderItems.dispatchedQty,
        })
        .from(salesOrderItems)
        .where(eq(salesOrderItems.soId, data.soId));

      const allDispatched = soItems.every(
        (item) => Number(item.dispatchedQty) >= Number(item.qty)
      );
      const anyDispatched = soItems.some(
        (item) => Number(item.dispatchedQty) > 0
      );

      if (allDispatched) {
        await tx
          .update(salesOrders)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(salesOrders.id, data.soId));
      } else if (anyDispatched) {
        await tx
          .update(salesOrders)
          .set({ status: "partial", updatedAt: new Date() })
          .where(eq(salesOrders.id, data.soId));
      }

      return dispatch;
    });

    revalidatePath("/sales/dispatches");
    revalidatePath("/sales/orders");
    return ok({ id: result.id, dispatchNo: result.dispatchNo });
  } catch (error) {
    return fail(dbErrorMessage(error, "creating dispatch"));
  }
}

export async function updateDispatchStatus(
  input: UpdateDispatchStatusInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = updateDispatchStatusInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, status, actualDeliveryDate } = parsed.data;

  try {
    const existing = await db
      .select({ status: dispatches.status, soId: dispatches.soId })
      .from(dispatches)
      .where(eq(dispatches.id, id))
      .limit(1);

    if (existing.length === 0) return fail("Dispatch not found");
    if (existing[0].status === "delivered")
      return fail("Already delivered");
    if (existing[0].status === "cancelled")
      return fail("Cannot update cancelled dispatch");

    await db.transaction(async (tx) => {
      if (status === "delivered") {
        const items = await tx
          .select({
            productId: dispatchItems.productId,
            qty: dispatchItems.qty,
          })
          .from(dispatchItems)
          .where(eq(dispatchItems.dispatchId, id));

        for (const item of items) {
          const result = await addLedgerMovement(tx, {
            productId: item.productId,
            qty: -Number(item.qty),
            type: "DISPATCH",
            note: `Dispatch ${id}`,
            referenceType: "dispatch",
            referenceId: id,
            userId: session.user.id,
          });

          if (!result.ok) return { ok: false, error: result.error };
        }

        await tx
          .update(dispatches)
          .set({
            status,
            actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : new Date(),
            deliveredBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(dispatches.id, id));

        const soItems = await tx
          .select({
            id: salesOrderItems.id,
            qty: salesOrderItems.qty,
            dispatchedQty: salesOrderItems.dispatchedQty,
          })
          .from(salesOrderItems)
          .where(eq(salesOrderItems.soId, existing[0].soId));

        const allDispatched = soItems.every(
          (item) => Number(item.dispatchedQty) >= Number(item.qty)
        );

        if (allDispatched) {
          await tx
            .update(salesOrders)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(salesOrders.id, existing[0].soId));
        }
      } else if (status === "cancelled") {
        const items = await tx
          .select({
            soItemId: dispatchItems.soItemId,
            qty: dispatchItems.qty,
          })
          .from(dispatchItems)
          .where(eq(dispatchItems.dispatchId, id));

        for (const item of items) {
          await tx
            .update(salesOrderItems)
            .set({
              dispatchedQty: sql`${salesOrderItems.dispatchedQty} - ${item.qty}`,
              updatedAt: new Date(),
            })
            .where(eq(salesOrderItems.id, item.soItemId));
        }

        await tx
          .update(dispatches)
          .set({ status, updatedAt: new Date() })
          .where(eq(dispatches.id, id));

        const soItems = await tx
          .select({
            id: salesOrderItems.id,
            qty: salesOrderItems.qty,
            dispatchedQty: salesOrderItems.dispatchedQty,
          })
          .from(salesOrderItems)
          .where(eq(salesOrderItems.soId, existing[0].soId));

        const anyDispatched = soItems.some(
          (item) => Number(item.dispatchedQty) > 0
        );
        const allDispatched = soItems.every(
          (item) => Number(item.dispatchedQty) >= Number(item.qty)
        );

        if (!anyDispatched) {
          await tx
            .update(salesOrders)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(salesOrders.id, existing[0].soId));
        } else if (!allDispatched) {
          await tx
            .update(salesOrders)
            .set({ status: "partial", updatedAt: new Date() })
            .where(eq(salesOrders.id, existing[0].soId));
        }
      } else {
        await tx
          .update(dispatches)
          .set({ status, updatedAt: new Date() })
          .where(eq(dispatches.id, id));
      }
    });

    revalidatePath("/sales/dispatches");
    revalidatePath("/sales/orders");
    revalidatePath("/inventory/raw-materials");
    return ok({ id });
  } catch (error) {
    return fail(dbErrorMessage(error, "updating dispatch status"));
  }
}

export async function cancelDispatch(
  input: { id: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = cancelDispatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id } = parsed.data;

  try {
    const existing = await db
      .select({ status: dispatches.status, soId: dispatches.soId })
      .from(dispatches)
      .where(eq(dispatches.id, id))
      .limit(1);

    if (existing.length === 0) return fail("Dispatch not found");
    if (existing[0].status === "delivered")
      return fail("Cannot cancel delivered dispatch");
    if (existing[0].status === "cancelled")
      return fail("Dispatch already cancelled");

    await db.transaction(async (tx) => {
      const items = await tx
        .select({
          soItemId: dispatchItems.soItemId,
          qty: dispatchItems.qty,
        })
        .from(dispatchItems)
        .where(eq(dispatchItems.dispatchId, id));

      for (const item of items) {
        await tx
          .update(salesOrderItems)
          .set({
            dispatchedQty: sql`${salesOrderItems.dispatchedQty} - ${item.qty}`,
            updatedAt: new Date(),
          })
          .where(eq(salesOrderItems.id, item.soItemId));
      }

      await tx
        .update(dispatches)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(dispatches.id, id));

      const soItems = await tx
        .select({
          id: salesOrderItems.id,
          qty: salesOrderItems.qty,
          dispatchedQty: salesOrderItems.dispatchedQty,
        })
        .from(salesOrderItems)
        .where(eq(salesOrderItems.soId, existing[0].soId));

      const anyDispatched = soItems.some(
        (item) => Number(item.dispatchedQty) > 0
      );
      const allDispatched = soItems.every(
        (item) => Number(item.dispatchedQty) >= Number(item.qty)
      );

      if (!anyDispatched) {
        await tx
          .update(salesOrders)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(salesOrders.id, existing[0].soId));
      } else if (!allDispatched) {
        await tx
          .update(salesOrders)
          .set({ status: "partial", updatedAt: new Date() })
          .where(eq(salesOrders.id, existing[0].soId));
      }
    });

    revalidatePath("/sales/dispatches");
    revalidatePath("/sales/orders");
    return ok({ id });
  } catch (error) {
    return fail(dbErrorMessage(error, "cancelling dispatch"));
  }
}