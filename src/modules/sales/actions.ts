"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  dbErrorMessage,
  fail,
  ok,
  zodErrorMessage,
  type ActionResult,
} from "@/lib/action-result";
import {
  createSalesOrderInputSchema,
  updateSalesOrderInputSchema,
  confirmSalesOrderInputSchema,
  cancelSalesOrderInputSchema,
  type CreateSalesOrderInput,
  type UpdateSalesOrderInput,
} from "./schemas";
import { getNextSONumber } from "./queries";
import {
  salesOrders,
  salesOrderItems,
} from "./schema";

export async function createSalesOrder(
  input: CreateSalesOrderInput
): Promise<ActionResult<{ id: string; soNo: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = createSalesOrderInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const soNo = await getNextSONumber();

      const [order] = await tx
        .insert(salesOrders)
        .values({
          id: randomUUID(),
          soNo,
          customerId: data.customerId,
          status: "draft",
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes ?? null,
          createdBy: session.user.id,
        })
        .returning({ id: salesOrders.id, soNo: salesOrders.soNo });

      for (const item of data.items) {
        await tx.insert(salesOrderItems).values({
          id: randomUUID(),
          soId: order.id,
          productId: item.productId,
          qty: item.qty,
          rate: item.rate ?? null,
          gstRate: item.gstRate,
        });
      }

      return order;
    });

    revalidatePath("/sales/orders");
    return ok({ id: result.id, soNo: result.soNo });
  } catch (error) {
    return fail(dbErrorMessage(error, "creating sales order"));
  }
}

export async function updateSalesOrder(
  input: UpdateSalesOrderInput & { id: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = updateSalesOrderInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;

  try {
    const existing = await db
      .select({ status: salesOrders.status })
      .from(salesOrders)
      .where(eq(salesOrders.id, id))
      .limit(1);

    if (existing.length === 0) return fail("Sales order not found");
    if (existing[0].status !== "draft")
      return fail("Can only update draft sales orders");

    await db.transaction(async (tx) => {
      await tx
        .update(salesOrders)
        .set({
          customerId: data.customerId,
          orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, id));

      if (data.items) {
        await tx.delete(salesOrderItems).where(eq(salesOrderItems.soId, id));

        for (const item of data.items) {
          await tx.insert(salesOrderItems).values({
            id: randomUUID(),
            soId: id,
            productId: item.productId,
            qty: item.qty,
            rate: item.rate ?? null,
            gstRate: item.gstRate,
          });
        }
      }
    });

    revalidatePath("/sales/orders");
    revalidatePath(`/sales/orders/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(dbErrorMessage(error, "updating sales order"));
  }
}

export async function confirmSalesOrder(
  input: { id: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = confirmSalesOrderInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id } = parsed.data;

  try {
    const existing = await db
      .select({ status: salesOrders.status })
      .from(salesOrders)
      .where(eq(salesOrders.id, id))
      .limit(1);

    if (existing.length === 0) return fail("Sales order not found");
    if (existing[0].status !== "draft")
      return fail("Only draft orders can be confirmed");

    await db
      .update(salesOrders)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(salesOrders.id, id));

    revalidatePath("/sales/orders");
    revalidatePath(`/sales/orders/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(dbErrorMessage(error, "confirming sales order"));
  }
}

export async function cancelSalesOrder(
  input: { id: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = cancelSalesOrderInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id } = parsed.data;

  try {
    const existing = await db
      .select({ status: salesOrders.status })
      .from(salesOrders)
      .where(eq(salesOrders.id, id))
      .limit(1);

    if (existing.length === 0) return fail("Sales order not found");
    if (existing[0].status === "completed")
      return fail("Cannot cancel completed orders");
    if (existing[0].status === "cancelled")
      return fail("Order already cancelled");

    await db
      .update(salesOrders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(salesOrders.id, id));

    revalidatePath("/sales/orders");
    revalidatePath(`/sales/orders/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(dbErrorMessage(error, "cancelling sales order"));
  }
}