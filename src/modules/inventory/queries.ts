import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { users } from "@/modules/auth/schema";
import { inventoryLedger } from "./schema";

export type StockBalanceRow = {
  rawMaterialId: string;
  name: string;
  code: string;
  unit: string;
  minStockQty: number;
  currentRate: number;
  currentBalance: number;
};

export async function getStockBalances(): Promise<StockBalanceRow[]> {
  const [materials, rows] = await Promise.all([
    db
      .select()
      .from(rawMaterials)
      .where(isNull(rawMaterials.archivedAt))
      .orderBy(asc(rawMaterials.name)),
    db
      .select({
        rawMaterialId: inventoryLedger.rawMaterialId,
        balance: inventoryLedger.balanceAfter,
        createdAt: inventoryLedger.createdAt,
      })
      .from(inventoryLedger)
      .where(eq(inventoryLedger.itemType, "raw_material"))
      .orderBy(desc(inventoryLedger.createdAt)),
  ]);

  const latestByMaterial = new Map<string, number>();
  for (const row of rows) {
    if (row.rawMaterialId == null) continue;
    if (!latestByMaterial.has(row.rawMaterialId)) {
      latestByMaterial.set(row.rawMaterialId, row.balance);
    }
  }

  return materials.map((material) => ({
    rawMaterialId: material.id,
    name: material.name,
    code: material.code,
    unit: material.unit,
    minStockQty: material.minStockQty,
    currentRate: material.currentRate,
    currentBalance: latestByMaterial.get(material.id) ?? 0,
  }));
}

export type LedgerHistoryRow = {
  id: string;
  type: string;
  qty: number;
  balanceAfter: number;
  note: string | null;
  referenceType: string | null;
  referenceId: string | null;
  userName: string | null;
  createdAt: Date;
};

export async function getLedgerHistory(
  rawMaterialId: string
): Promise<LedgerHistoryRow[]> {
  return db
    .select({
      id: inventoryLedger.id,
      type: inventoryLedger.type,
      qty: inventoryLedger.qty,
      balanceAfter: inventoryLedger.balanceAfter,
      note: inventoryLedger.note,
      referenceType: inventoryLedger.referenceType,
      referenceId: inventoryLedger.referenceId,
      userName: users.name,
      createdAt: inventoryLedger.createdAt,
    })
    .from(inventoryLedger)
    .leftJoin(users, eq(users.id, inventoryLedger.userId))
    .where(
      and(
        eq(inventoryLedger.itemType, "raw_material"),
        eq(inventoryLedger.rawMaterialId, rawMaterialId)
      )
    )
    .orderBy(desc(inventoryLedger.createdAt), desc(inventoryLedger.id));
}

export async function getLedgerBalance(
  rawMaterialId: string
): Promise<number> {
  const [last] = await db
    .select({ balance: inventoryLedger.balanceAfter })
    .from(inventoryLedger)
    .where(
      and(
        eq(inventoryLedger.itemType, "raw_material"),
        eq(inventoryLedger.rawMaterialId, rawMaterialId)
      )
    )
    .orderBy(desc(inventoryLedger.createdAt))
    .limit(1);
  return last?.balance ?? 0;
}