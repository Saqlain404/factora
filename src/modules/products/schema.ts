import {
  pgTable,
  text,
  numeric,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { moulds } from "@/modules/moulds/schema";

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    unit: text("unit").notNull(),
    mouldId: text("mould_id").references(() => moulds.id),
    hsnCode: text("hsn_code"),
    gstRate: numeric("gst_rate", { precision: 6, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    sellingPrice: numeric("selling_price", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [check("products_selling_price_non_negative", sql`${table.sellingPrice} >= 0`)]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;