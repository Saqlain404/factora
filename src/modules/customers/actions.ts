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
import { customers } from "./schema";
import { customerInputSchema, customerUpdateSchema, type CustomerInput, type CustomerUpdate } from "./schemas";

export async function createCustomer(
  input: CustomerInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(customers).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("CUST")),
      contactPhone: data.contactPhone,
      email: data.email,
      gstin: data.gstin,
      state: data.state,
      stateCode: data.stateCode,
      address: data.address,
      creditPeriodDays: data.creditPeriodDays,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "customer"));
  }

  revalidatePath("/customers");
  return ok({ id });
}

export async function updateCustomer(
  input: CustomerUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = customerUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(customers)
      .set({
        name: data.name,
        contactPhone: data.contactPhone,
        email: data.email,
        gstin: data.gstin,
        state: data.state,
        stateCode: data.stateCode,
        address: data.address,
        creditPeriodDays: data.creditPeriodDays,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "customer"));
  }

  revalidatePath("/customers");
  return ok({ id });
}

export async function archiveCustomer(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid customer id");

  await db
    .update(customers)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(customers.id, parsed.data));

  revalidatePath("/customers");
  return ok({ id: parsed.data });
}