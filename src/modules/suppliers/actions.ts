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
import { suppliers } from "./schema";
import { supplierInputSchema, supplierUpdateSchema, type SupplierInput, type SupplierUpdate } from "./schemas";

export async function createSupplier(
  input: SupplierInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(suppliers).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("SUPP")),
      contactPhone: data.contactPhone,
      email: data.email,
      gstin: data.gstin,
      address: data.address,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "supplier"));
  }

  revalidatePath("/suppliers");
  return ok({ id });
}

export async function updateSupplier(
  input: SupplierUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = supplierUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(suppliers)
      .set({
        name: data.name,
        contactPhone: data.contactPhone,
        email: data.email,
        gstin: data.gstin,
        address: data.address,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "supplier"));
  }

  revalidatePath("/suppliers");
  return ok({ id });
}

export async function archiveSupplier(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid supplier id");

  await db
    .update(suppliers)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(suppliers.id, parsed.data));

  revalidatePath("/suppliers");
  return ok({ id: parsed.data });
}