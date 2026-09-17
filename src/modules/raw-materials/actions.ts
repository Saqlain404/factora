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
import { generateCode, normalizeCode } from "@/lib/business-codes";
import { rawMaterials } from "./schema";
import {
  rawMaterialInputSchema,
  rawMaterialUpdateSchema,
  type RawMaterialInput,
  type RawMaterialUpdate,
} from "./schemas";

export async function createRawMaterial(
  input: RawMaterialInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = rawMaterialInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(rawMaterials).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("RM")),
      unit: data.unit,
      hsnCode: data.hsnCode,
      currentRate: data.currentRate ?? 0,
      gstRate: data.gstRate ?? 0,
      minStockQty: data.minStockQty ?? 0,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "raw material"));
  }

  revalidatePath("/raw-materials");
  return ok({ id });
}

export async function updateRawMaterial(
  input: RawMaterialUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = rawMaterialUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(rawMaterials)
      .set({
        name: data.name,
        unit: data.unit,
        hsnCode: data.hsnCode,
        currentRate: data.currentRate,
        gstRate: data.gstRate,
        minStockQty: data.minStockQty,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(rawMaterials.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "raw material"));
  }

  revalidatePath("/raw-materials");
  return ok({ id });
}

export async function archiveRawMaterial(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid raw material id");

  await db
    .update(rawMaterials)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(rawMaterials.id, parsed.data));

  revalidatePath("/raw-materials");
  return ok({ id: parsed.data });
}