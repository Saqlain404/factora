import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const rawMaterials = pgTable("raw_materials", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  unit: text("unit").notNull(),
  hsnCode: text("hsn_code"),
  currentRate: numeric("current_rate", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  gstRate: numeric("gst_rate", { precision: 6, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  minStockQty: numeric("min_stock_qty", {
    precision: 14,
    scale: 3,
    mode: "number",
  })
    .notNull()
    .default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export type RawMaterial = typeof rawMaterials.$inferSelect;
export type NewRawMaterial = typeof rawMaterials.$inferInsert;