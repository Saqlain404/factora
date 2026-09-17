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
import { machines } from "./schema";
import { machineInputSchema, machineUpdateSchema, type MachineInput, type MachineUpdate } from "./schemas";

export async function createMachine(
  input: MachineInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = machineInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(machines).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("MCH")),
      capacity: data.capacity,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "machine"));
  }

  revalidatePath("/machines");
  return ok({ id });
}

export async function updateMachine(
  input: MachineUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = machineUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(machines)
      .set({
        name: data.name,
        capacity: data.capacity,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(machines.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "machine"));
  }

  revalidatePath("/machines");
  return ok({ id });
}

export async function archiveMachine(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid machine id");

  await db
    .update(machines)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(machines.id, parsed.data));

  revalidatePath("/machines");
  return ok({ id: parsed.data });
}