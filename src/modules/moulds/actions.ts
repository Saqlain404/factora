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
import { moulds, type NewMould } from "./schema";
import { nextMouldStatus } from "./domain";
import { mouldInputSchema, mouldUpdateSchema, type MouldInput, type MouldUpdate } from "./schemas";

export async function createMould(
  input: MouldInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = mouldInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  try {
    await db.insert(moulds).values({
      id,
      name: data.name,
      code: normalizeCode(data.code ?? generateCode("MOULD")),
      supplierId: data.supplierId,
      cost: data.cost ?? 0,
      notes: data.notes,
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "mould"));
  }

  revalidatePath("/moulds");
  return ok({ id });
}

export async function updateMould(
  input: MouldUpdate
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = mouldUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const { id, ...data } = parsed.data;
  try {
    await db
      .update(moulds)
      .set({
        name: data.name,
        supplierId: data.supplierId,
        cost: data.cost,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(moulds.id, id));
  } catch (error) {
    return fail(dbErrorMessage(error, "mould"));
  }

  revalidatePath("/moulds");
  return ok({ id });
}

export async function archiveMould(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid mould id");

  await db
    .update(moulds)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(moulds.id, parsed.data));

  revalidatePath("/moulds");
  return ok({ id: parsed.data });
}

export async function advanceMouldStatus(
  id: string
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await auth();
  if (!session?.user) return fail("Not authenticated");

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid mould id");

  const [mould] = await db
    .select()
    .from(moulds)
    .where(eq(moulds.id, parsed.data))
    .limit(1);
  if (!mould) return fail("Mould not found");

  const transition = nextMouldStatus(mould.status);
  if (!transition.ok) return fail(transition.error);

  const now = new Date();
  const patch: Partial<NewMould> = {
    status: transition.next,
    updatedAt: now,
  };
  if (transition.next === "received") patch.receivedAt = now;
  if (transition.next === "trial") patch.trialAt = now;
  if (transition.next === "active") patch.activeAt = now;

  await db.update(moulds).set(patch).where(eq(moulds.id, parsed.data));

  revalidatePath("/moulds");
  return ok({ id: parsed.data, status: transition.next });
}