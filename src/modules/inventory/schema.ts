import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/modules/auth/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { products } from "@/modules/products/schema";

export const inventoryTransactionTypeEnum = pgEnum("inventory_transaction_type", [
  "PURCHASE_RECEIPT",
  "PRODUCTION_CONSUMPTION",
  "PRODUCTION_OUTPUT",
  "PRODUCTION_RETURN",
  "DISPATCH",
  "ADJUSTMENT",
]);

export const inventoryLedger = pgTable(
  "inventory_ledger",
  {
    id: text("id").primaryKey(),
    itemType: text("item_type").notNull(),
    rawMaterialId: text("raw_material_id").references(() => rawMaterials.id),
    productId: text("product_id").references(() => products.id),
    type: inventoryTransactionTypeEnum("type").notNull(),
    qty: numeric("qty", { precision: 14, scale: 3, mode: "number" }).notNull(),
    balanceAfter: numeric("balance_after", {
      precision: 14,
      scale: 3,
      mode: "number",
    }).notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    note: text("note"),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "inventory_ledger_item_type",
      sql`${table.itemType} in ('raw_material','product')`
    ),
    check(
      "inventory_ledger_balance_non_negative",
      sql`${table.balanceAfter} >= 0`
    ),
  ]
);

export type InventoryLedgerRow = typeof inventoryLedger.$inferSelect;
export type NewInventoryLedgerRow = typeof inventoryLedger.$inferInsert;
export type InventoryTransactionType =
  (typeof inventoryTransactionTypeEnum.enumValues)[number];