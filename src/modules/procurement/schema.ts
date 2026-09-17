import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { suppliers } from "@/modules/suppliers/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { users } from "@/modules/auth/schema";

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "draft",
  "confirmed",
  "received",
  "closed",
]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  poNo: text("po_no").notNull().unique(),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  status: purchaseOrderStatusEnum("status").default("draft").notNull(),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: text("id").primaryKey(),
    poId: text("po_id")
      .notNull()
      .references(() => purchaseOrders.id),
    rawMaterialId: text("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id),
    qty: numeric("qty", { precision: 14, scale: 3, mode: "number" }).notNull(),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }),
    gstRate: numeric("gst_rate", { precision: 6, scale: 2, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check("purchase_order_items_qty_positive", sql`${table.qty} > 0`)]
);

export const purchaseReceipts = pgTable(
  "purchase_receipts",
  {
    id: text("id").primaryKey(),
    poId: text("po_id")
      .notNull()
      .references(() => purchaseOrders.id),
    rawMaterialId: text("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id),
    qty: numeric("qty", { precision: 14, scale: 3, mode: "number" }).notNull(),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }).notNull(),
    gstRate: numeric("gst_rate", { precision: 6, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    billNo: text("bill_no"),
    billDate: timestamp("bill_date", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id").references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("purchase_receipts_qty_positive", sql`${table.qty} > 0`),
    check("purchase_receipts_rate_non_negative", sql`${table.rate} >= 0`),
  ]
);

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type PurchaseReceipt = typeof purchaseReceipts.$inferSelect;
export type PurchaseOrderStatus =
  (typeof purchaseOrderStatusEnum.enumValues)[number];