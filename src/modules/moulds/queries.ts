import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { moulds } from "./schema";
import { suppliers } from "@/modules/suppliers/schema";

export type MouldWithSupplier = typeof moulds.$inferSelect & {
  supplierName: string | null;
};

export async function listMoulds(opts?: { includeArchived?: boolean }): Promise<MouldWithSupplier[]> {
  return db
    .select({
      id: moulds.id,
      name: moulds.name,
      code: moulds.code,
      status: moulds.status,
      supplierId: moulds.supplierId,
      supplierName: suppliers.name,
      cost: moulds.cost,
      receivedAt: moulds.receivedAt,
      trialAt: moulds.trialAt,
      activeAt: moulds.activeAt,
      notes: moulds.notes,
      createdAt: moulds.createdAt,
      updatedAt: moulds.updatedAt,
      archivedAt: moulds.archivedAt,
    })
    .from(moulds)
    .leftJoin(suppliers, eq(suppliers.id, moulds.supplierId))
    .where(opts?.includeArchived ? undefined : isNull(moulds.archivedAt))
    .orderBy(asc(moulds.name));
}

export async function getMouldById(id: string) {
  const [row] = await db
    .select({
      id: moulds.id,
      name: moulds.name,
      code: moulds.code,
      status: moulds.status,
      supplierId: moulds.supplierId,
      supplierName: suppliers.name,
      cost: moulds.cost,
      receivedAt: moulds.receivedAt,
      trialAt: moulds.trialAt,
      activeAt: moulds.activeAt,
      notes: moulds.notes,
      createdAt: moulds.createdAt,
      updatedAt: moulds.updatedAt,
      archivedAt: moulds.archivedAt,
    })
    .from(moulds)
    .leftJoin(suppliers, eq(suppliers.id, moulds.supplierId))
    .where(eq(moulds.id, id))
    .limit(1);
  return row;
}