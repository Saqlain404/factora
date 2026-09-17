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
import { products } from "./schema";
import { productInputSchema, productUpdateSchema, type ProductInput, type ProductUpdate } from "./schemas";

export async function createProduct(
  input: ProductInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(products).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("PRD")),
      unit: data.unit,
      mouldId: data.mouldId,
      hsnCode: data.hsnCode,
      gstRate: data.gstRate ?? 0,
      sellingPrice: data.sellingPrice ?? 0,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "product"));
  }

  revalidatePath("/products");
  return ok({ id });
}

export async function updateProduct(
  input: ProductUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(products)
      .set({
        name: data.name,
        unit: data.unit,
        mouldId: data.mouldId,
        hsnCode: data.hsnCode,
        gstRate: data.gstRate,
        sellingPrice: data.sellingPrice,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "product"));
  }

  revalidatePath("/products");
  return ok({ id });
}

export async function archiveProduct(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid product id");

  await db
    .update(products)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(products.id, parsed.data));

  revalidatePath("/products");
  return ok({ id: parsed.data });
}