import type { BatchStatus } from "./schema";
import { roundToThree } from "@/modules/inventory/domain";

export type DomainResult =
  | { ok: true }
  | { ok: false; error: string };

export type ConsumptionLine = {
  rawMaterialId: string;
  consumedQty: number;
};

export type ReservedLine = {
  rawMaterialId: string;
  plannedQty: number;
};

export function batchCanStart(status: BatchStatus): boolean {
  return status === "in_progress";
}

export function batchCanComplete(
  status: BatchStatus,
  startedAt: Date | null
): boolean {
  return status === "in_progress" && startedAt !== null;
}

export function batchCanCancel(status: BatchStatus): boolean {
  return status === "in_progress";
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeUnusedQty(planned: number, consumed: number): number {
  return roundToThree(Math.max(0, planned - consumed));
}

export function consumedMatchesReserved(
  consumption: readonly ConsumptionLine[],
  reserved: readonly ReservedLine[]
): DomainResult {
  const consumedByMaterial = new Map<string, number>();
  for (const line of consumption) {
    if (consumedByMaterial.has(line.rawMaterialId)) {
      return { ok: false, error: `Material appears more than once: ${line.rawMaterialId}` };
    }
    if (!Number.isFinite(line.consumedQty) || line.consumedQty < 0) {
      return { ok: false, error: "Consumed quantity must be a non-negative number" };
    }
    consumedByMaterial.set(line.rawMaterialId, line.consumedQty);
  }
  for (const material of reserved) {
    if (!consumedByMaterial.has(material.rawMaterialId)) {
      return {
        ok: false,
        error: `Consumption missing for a reserved material (${material.rawMaterialId})`,
      };
    }
  }
  return { ok: true };
}

export function batchCostsTotal(costs: {
  materialCost: number;
  labourCost: number;
  electricityCost: number;
  mouldAllocation: number;
  otherCosts: number;
}): number {
  return roundMoney(
    costs.materialCost +
      costs.labourCost +
      costs.electricityCost +
      costs.mouldAllocation +
      costs.otherCosts
  );
}