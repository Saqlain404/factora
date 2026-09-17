"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
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
import { bomItems } from "./schema";
import {
  bomItemInputSchema,
  bomItemUpdateSchema,
  type BomItemInput,
  type BomItemUpdate,
} from "./schemas";

export async function createBomItem(
  input: BomItemInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = bomItemInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(bomItems).values({
      id,
      productId: data.productId,
      rawMaterialId: data.rawMaterialId,
      qtyPerUnit: data.qtyPerUnit,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "BOM item"));
  }

  revalidatePath("/bom");
  return ok({ id });
}

export async function updateBomItem(
  input: BomItemUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = bomItemUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(bomItems)
      .set({ qtyPerUnit: data.qtyPerUnit, updatedAt: new Date() })
      .where(and(eq(bomItems.id, id)));
  } catch (error) {
    return fail(dbErrorMessage(error, "BOM item"));
  }

  revalidatePath("/bom");
  return ok({ id });
}

export async function deleteBomItem(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid BOM item id");

  await db.delete(bomItems).where(eq(bomItems.id, parsed.data));

  revalidatePath("/bom");
  return ok({ id: parsed.data });
}