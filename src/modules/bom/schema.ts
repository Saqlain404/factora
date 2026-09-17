import {
  pgTable,
  text,
  numeric,
  timestamp,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "@/modules/products/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";

export const bomItems = pgTable(
  "bom_items",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    rawMaterialId: text("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id),
    qtyPerUnit: numeric("qty_per_unit", {
      precision: 14,
      scale: 4,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("bom_items_qty_positive", sql`${table.qtyPerUnit} > 0`),
    uniqueIndex("bom_items_product_material_uq").on(
      table.productId,
      table.rawMaterialId
    ),
  ]
);

export type BomItem = typeof bomItems.$inferSelect;
export type NewBomItem = typeof bomItems.$inferInsert;