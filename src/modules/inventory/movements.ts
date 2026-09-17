import "server-only";

import { randomUUID } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventoryLedger, type InventoryTransactionType } from "./schema";
import { applyLedgerMovement } from "./domain";

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type ItemType = "raw_material" | "product";

export type LedgerMovementInput = {
  rawMaterialId?: string;
  productId?: string;
  qty: number;
  type: InventoryTransactionType;
  note?: string;
  referenceType?: string;
  referenceId?: string;
  userId: string;
};

export type LedgerMovementResult =
  | { ok: true; balanceAfter: number }
  | { ok: false; error: string };

export async function addLedgerMovement(
  tx: Tx,
  entry: LedgerMovementInput
): Promise<LedgerMovementResult> {
  const itemType: ItemType = entry.productId ? "product" : "raw_material";
  const itemId = entry.productId ?? entry.rawMaterialId;
  if (!itemId) return { ok: false, error: "Missing inventory item" };

  const lockKey = `inventory-${itemType}-${itemId}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

  const [last] = await tx
    .select({ balance: inventoryLedger.balanceAfter })
    .from(inventoryLedger)
    .where(
      and(
        eq(inventoryLedger.itemType, itemType),
        itemType === "product"
          ? eq(inventoryLedger.productId, itemId)
          : eq(inventoryLedger.rawMaterialId, itemId)
      )
    )
    .orderBy(desc(inventoryLedger.createdAt))
    .limit(1);

  const movement = applyLedgerMovement(last?.balance ?? 0, entry.qty);
  if (!movement.ok) return { ok: false, error: movement.error };

  await tx.insert(inventoryLedger).values({
    id: randomUUID(),
    itemType,
    rawMaterialId: itemType === "raw_material" ? itemId : null,
    productId: itemType === "product" ? itemId : null,
    type: entry.type,
    qty: entry.qty,
    balanceAfter: movement.balanceAfter,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    note: entry.note,
    userId: entry.userId,
  });

  return { ok: true, balanceAfter: movement.balanceAfter };
}