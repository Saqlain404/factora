"use server";

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
import { adjustStockInputSchema, type AdjustStockInput } from "./schemas";
import { addLedgerMovement } from "./movements";

export async function adjustStock(
  input: AdjustStockInput
): Promise<ActionResult<{ balanceAfter: number }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = adjustStockInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  try {
    const result = await db.transaction(async (tx) =>
      addLedgerMovement(tx, {
        rawMaterialId: data.rawMaterialId,
        qty: data.qty,
        type: "ADJUSTMENT",
        note: data.note,
        referenceType: "manual_adjustment",
        userId: session.user.id,
      })
    );
    if (!result.ok) return fail(result.error);

    revalidatePath("/inventory/raw-materials");
    revalidatePath("/raw-materials");
    return ok({ balanceAfter: result.balanceAfter });
  } catch (error) {
    return fail(dbErrorMessage(error, "stock adjustment"));
  }
}