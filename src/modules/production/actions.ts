"use server";

import { randomUUID } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
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
import { generateCode } from "@/lib/business-codes";
import { addLedgerMovement } from "@/modules/inventory/movements";
import { moulds } from "@/modules/moulds/schema";
import { bomItems } from "@/modules/bom/schema";
import { productionBatches, batchMaterials, batchCosts } from "./schema";
import {
  createBatchInputSchema,
  startBatchInputSchema,
  completeBatchInputSchema,
  cancelBatchInputSchema,
  batchCostsInputSchema,
  type CreateBatchInput,
  type StartBatchInput,
  type CompleteBatchInput,
  type CancelBatchInput,
  type BatchCostsInput,
} from "./schemas";
import {
  batchCanComplete,
  batchCanStart,
  batchCanCancel,
  batchCostsTotal,
  consumedMatchesReserved,
  computeUnusedQty,
} from "./domain";

export async function createBatch(
  input: CreateBatchInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = createBatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const id = randomUUID();
  const batchNo = generateCode("BATCH");

  try {
    const result = await db.transaction(async (tx) => {
      const [mould] = await tx
        .select()
        .from(moulds)
        .where(and(eq(moulds.id, data.mouldId), isNull(moulds.archivedAt)))
        .limit(1);
      if (!mould) {
        return { ok: false as const, error: "Mould not found" };
      }
      if (mould.status !== "active") {
        return {
          ok: false as const,
          error: "Only an active mould can be used on a batch (DEC-015)",
        };
      }

      const bom = await tx
        .select({ rawMaterialId: bomItems.rawMaterialId })
        .from(bomItems)
        .where(eq(bomItems.productId, data.productId));
      const bomMaterialIds = new Set(bom.map((row) => row.rawMaterialId));
      const reservedMaterialIds = new Set(
        data.materials.map((material) => material.rawMaterialId)
      );
      if (bom.length === 0 && data.materials.length > 0) {
        return {
          ok: false as const,
          error: "This product has no BOM, so a batch cannot reserve materials",
        };
      }
      if (bom.length > 0) {
        const missing = [...bomMaterialIds].filter(
          (materialId) => !reservedMaterialIds.has(materialId)
        );
        const extra = [...reservedMaterialIds].filter(
          (materialId) => !bomMaterialIds.has(materialId)
        );
        if (missing.length > 0 || extra.length > 0) {
          return {
            ok: false as const,
            error: "Reserved materials must match the product BOM (R12)",
          };
        }
      }

      await tx.insert(productionBatches).values({
        id,
        batchNo,
        orderId: data.orderId ?? null,
        productId: data.productId,
        machineId: data.machineId,
        mouldId: data.mouldId,
        planQty: data.planQty,
        status: "in_progress",
        notes: data.notes ?? null,
        createdBy: session.user.id,
      });
      await tx.insert(batchMaterials).values(
        data.materials.map((material) => ({
          id: randomUUID(),
          batchId: id,
          rawMaterialId: material.rawMaterialId,
          plannedQty: material.plannedQty,
        }))
      );
      return { ok: true as const, id };
    });

    if (!result.ok) return fail(result.error);

    revalidatePath("/production/batches");
    return ok({ id: result.id });
  } catch (error) {
    return fail(dbErrorMessage(error, "production batch"));
  }
}

export async function startBatch(
  input: StartBatchInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = startBatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const batchId = parsed.data.batchId;
  try {
    const [batch] = await db
      .select()
      .from(productionBatches)
      .where(eq(productionBatches.id, batchId))
      .limit(1);
    if (!batch) return fail("Production batch not found");
    if (!batchCanStart(batch.status)) {
      return fail("This batch can no longer be started");
    }
    if (batch.startedAt) return fail("This batch has already been started");

    await db.transaction(async (tx) => {
      await tx
        .update(productionBatches)
        .set({ startedAt: new Date(), updatedAt: new Date() })
        .where(eq(productionBatches.id, batchId));
      await tx
        .update(batchMaterials)
        .set({ reservedAt: new Date() })
        .where(eq(batchMaterials.batchId, batchId));
    });
  } catch (error) {
    return fail(dbErrorMessage(error, "production batch"));
  }

  revalidatePath("/production/batches");
  revalidatePath(`/production/batches/${batchId}`);
  return ok({ id: batchId });
}

export async function completeBatch(
  input: CompleteBatchInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = completeBatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      const [batch] = await tx
        .select({
          id: productionBatches.id,
          status: productionBatches.status,
          startedAt: productionBatches.startedAt,
          productId: productionBatches.productId,
        })
        .from(productionBatches)
        .where(eq(productionBatches.id, data.batchId))
        .limit(1);
      if (!batch) return { ok: false as const, error: "Production batch not found" };
      if (!batchCanComplete(batch.status, batch.startedAt)) {
        return {
          ok: false as const,
          error: "Only a started batch in progress can be completed",
        };
      }

      const reserved = await tx
        .select({
          rawMaterialId: batchMaterials.rawMaterialId,
          plannedQty: batchMaterials.plannedQty,
        })
        .from(batchMaterials)
        .where(eq(batchMaterials.batchId, data.batchId));

      const consumptionCheck = consumedMatchesReserved(data.consumption, reserved);
      if (!consumptionCheck.ok) {
        return { ok: false as const, error: consumptionCheck.error };
      }

      const consumedByMaterial = new Map<string, number>();
      for (const line of data.consumption) {
        consumedByMaterial.set(line.rawMaterialId, line.consumedQty);
      }

      const now = new Date();
      for (const material of reserved) {
        const consumedQty = consumedByMaterial.get(material.rawMaterialId) ?? 0;
        if (consumedQty > 0) {
          const movement = await addLedgerMovement(tx, {
            rawMaterialId: material.rawMaterialId,
            qty: -consumedQty,
            type: "PRODUCTION_CONSUMPTION",
            referenceType: "production_batch",
            referenceId: data.batchId,
            userId: session.user.id,
          });
          if (!movement.ok) return { ok: false as const, error: movement.error };
        }
        const unusedQty = computeUnusedQty(material.plannedQty, consumedQty);
        await tx
          .update(batchMaterials)
          .set({
            consumedQty: consumedQty === 0 ? null : consumedQty,
            consumedAt: consumedQty > 0 ? now : null,
            returnedAt: unusedQty > 0 ? now : null,
          })
          .where(
            and(
              eq(batchMaterials.batchId, data.batchId),
              eq(batchMaterials.rawMaterialId, material.rawMaterialId)
            )
          );
      }

      if (data.okQty > 0) {
        const output = await addLedgerMovement(tx, {
          productId: batch.productId,
          qty: data.okQty,
          type: "PRODUCTION_OUTPUT",
          referenceType: "production_batch",
          referenceId: data.batchId,
          userId: session.user.id,
        });
        if (!output.ok) return { ok: false as const, error: output.error };
      }

      await tx
        .update(productionBatches)
        .set({
          status: "completed",
          okQty: data.okQty,
          rejectedQty: data.rejectedQty,
          completedAt: now,
          completedBy: session.user.id,
          updatedAt: now,
        })
        .where(eq(productionBatches.id, data.batchId));

      return { ok: true as const, id: data.batchId };
    });

    if (!result.ok) return fail(result.error);

    revalidatePath("/production/batches");
    revalidatePath(`/production/batches/${result.id}`);
    revalidatePath("/inventory/raw-materials");
    return ok({ id: result.id });
  } catch (error) {
    return fail(dbErrorMessage(error, "production batch"));
  }
}

export async function cancelBatch(
  input: CancelBatchInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = cancelBatchInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const batchId = parsed.data.batchId;
  try {
    const [batch] = await db
      .select()
      .from(productionBatches)
      .where(eq(productionBatches.id, batchId))
      .limit(1);
    if (!batch) return fail("Production batch not found");
    if (!batchCanCancel(batch.status)) {
      return fail("Only batches still in progress can be cancelled");
    }

    await db
      .update(productionBatches)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(productionBatches.id, batchId));
  } catch (error) {
    return fail(dbErrorMessage(error, "production batch"));
  }

  revalidatePath("/production/batches");
  revalidatePath(`/production/batches/${batchId}`);
  return ok({ id: batchId });
}

export async function recordBatchCosts(
  input: BatchCostsInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("Not authenticated");

  const parsed = batchCostsInputSchema.safeParse(input);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error));

  const data = parsed.data;
  const total = batchCostsTotal({
    materialCost: data.materialCost,
    labourCost: data.labourCost,
    electricityCost: data.electricityCost,
    mouldAllocation: data.mouldAllocation,
    otherCosts: data.otherCosts,
  });

  try {
    const [batch] = await db
      .select()
      .from(productionBatches)
      .where(eq(productionBatches.id, data.batchId))
      .limit(1);
    if (!batch) return fail("Production batch not found");

    const existing = await db
      .select({ id: batchCosts.id })
      .from(batchCosts)
      .where(eq(batchCosts.batchId, data.batchId))
      .limit(1);

    const values = {
      materialCost: data.materialCost,
      labourCost: data.labourCost,
      electricityCost: data.electricityCost,
      mouldAllocation: data.mouldAllocation,
      otherCosts: data.otherCosts,
      total,
    };

    if (existing[0]) {
      await db
        .update(batchCosts)
        .set({ ...values, enteredBy: session.user.id, enteredAt: new Date() })
        .where(eq(batchCosts.id, existing[0].id));
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(batchCosts).values({
          id: randomUUID(),
          batchId: data.batchId,
          ...values,
          enteredBy: session.user.id,
        });
      });
    }
  } catch (error) {
    return fail(dbErrorMessage(error, "batch costs"));
  }

  revalidatePath("/production/batches");
  revalidatePath(`/production/batches/${data.batchId}`);
  return ok({ id: data.batchId });
}