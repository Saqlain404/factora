import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { productionBatches, batchMaterials, batchCosts } from "./schema";
import { products } from "@/modules/products/schema";
import { machines } from "@/modules/machines/schema";
import { moulds } from "@/modules/moulds/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { users } from "@/modules/auth/schema";

export type BatchListItem = {
  id: string;
  batchNo: string;
  orderId: string | null;
  planQty: number;
  okQty: number | null;
  rejectedQty: number | null;
  status: "in_progress" | "completed" | "cancelled";
  productId: string;
  productName: string;
  productCode: string;
  productUnit: string;
  machineName: string;
  mouldName: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  createdByName: string | null;
  totalCost: number | null;
};

export async function listBatches(): Promise<BatchListItem[]> {
  return db
    .select({
      id: productionBatches.id,
      batchNo: productionBatches.batchNo,
      orderId: productionBatches.orderId,
      planQty: productionBatches.planQty,
      okQty: productionBatches.okQty,
      rejectedQty: productionBatches.rejectedQty,
      status: productionBatches.status,
      productId: productionBatches.productId,
      productName: products.name,
      productCode: products.code,
      productUnit: products.unit,
      machineName: machines.name,
      mouldName: moulds.name,
      startedAt: productionBatches.startedAt,
      completedAt: productionBatches.completedAt,
      createdAt: productionBatches.createdAt,
      createdByName: users.name,
      totalCost: batchCosts.total,
    })
    .from(productionBatches)
    .innerJoin(products, eq(products.id, productionBatches.productId))
    .innerJoin(machines, eq(machines.id, productionBatches.machineId))
    .innerJoin(moulds, eq(moulds.id, productionBatches.mouldId))
    .leftJoin(users, eq(users.id, productionBatches.createdBy))
    .leftJoin(batchCosts, eq(batchCosts.batchId, productionBatches.id))
    .orderBy(desc(productionBatches.createdAt));
}

export type BatchMaterialRow = {
  id: string;
  batchId: string;
  rawMaterialId: string;
  materialName: string;
  materialUnit: string;
  plannedQty: number;
  reservedAt: Date | null;
  consumedQty: number | null;
  consumedAt: Date | null;
  returnedAt: Date | null;
};

export type BatchCostsRow = typeof batchCosts.$inferSelect;

export type BatchDetail = {
  batch: {
    id: string;
    batchNo: string;
    orderId: string | null;
    productId: string;
    productName: string;
    productCode: string;
    productUnit: string;
    machineId: string;
    machineName: string;
    mouldId: string;
    mouldName: string;
    mouldCode: string;
    planQty: number;
    okQty: number | null;
    rejectedQty: number | null;
    status: "in_progress" | "completed" | "cancelled";
    notes: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    createdByName: string | null;
    completedByName: string | null;
  };
  materials: BatchMaterialRow[];
  costs: BatchCostsRow | null;
};

export async function getBatchById(id: string): Promise<BatchDetail | null> {
  const [batchRow] = await db
    .select({
      id: productionBatches.id,
      batchNo: productionBatches.batchNo,
      orderId: productionBatches.orderId,
      productId: productionBatches.productId,
      productName: products.name,
      productCode: products.code,
      productUnit: products.unit,
      machineId: productionBatches.machineId,
      machineName: machines.name,
      mouldId: productionBatches.mouldId,
      mouldName: moulds.name,
      mouldCode: moulds.code,
      planQty: productionBatches.planQty,
      okQty: productionBatches.okQty,
      rejectedQty: productionBatches.rejectedQty,
      status: productionBatches.status,
      notes: productionBatches.notes,
      startedAt: productionBatches.startedAt,
      completedAt: productionBatches.completedAt,
      cancelledAt: productionBatches.cancelledAt,
      completedBy: productionBatches.completedBy,
      createdAt: productionBatches.createdAt,
      createdByName: users.name,
    })
    .from(productionBatches)
    .innerJoin(products, eq(products.id, productionBatches.productId))
    .innerJoin(machines, eq(machines.id, productionBatches.machineId))
    .innerJoin(moulds, eq(moulds.id, productionBatches.mouldId))
    .leftJoin(users, eq(users.id, productionBatches.createdBy))
    .where(eq(productionBatches.id, id))
    .limit(1);

  if (!batchRow) return null;

  const [materials, costs, completedBy] = await Promise.all([
    db
      .select({
        id: batchMaterials.id,
        batchId: batchMaterials.batchId,
        rawMaterialId: batchMaterials.rawMaterialId,
        materialName: rawMaterials.name,
        materialUnit: rawMaterials.unit,
        plannedQty: batchMaterials.plannedQty,
        reservedAt: batchMaterials.reservedAt,
        consumedQty: batchMaterials.consumedQty,
        consumedAt: batchMaterials.consumedAt,
        returnedAt: batchMaterials.returnedAt,
      })
      .from(batchMaterials)
      .innerJoin(rawMaterials, eq(rawMaterials.id, batchMaterials.rawMaterialId))
      .where(eq(batchMaterials.batchId, id))
      .orderBy(rawMaterials.name),
    db.select().from(batchCosts).where(eq(batchCosts.batchId, id)).limit(1),
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, batchRow.completedBy ?? ""))
      .limit(1),
  ]);

  return {
    batch: {
      ...batchRow,
      completedByName: completedBy[0]?.name ?? null,
    },
    materials,
    costs: costs[0] ?? null,
  };
}

export async function listActiveMoulds() {
  return db
    .select({
      id: moulds.id,
      name: moulds.name,
      code: moulds.code,
    })
    .from(moulds)
    .where(and(eq(moulds.status, "active"), isNull(moulds.archivedAt)))
    .orderBy(moulds.name);
}