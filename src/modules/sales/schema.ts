import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customers } from "@/modules/customers/schema";
import { products } from "@/modules/products/schema";
import { users } from "@/modules/auth/schema";

export const salesOrderStatusEnum = pgEnum("sales_order_status", [
  "draft",
  "confirmed",
  "partial",
  "completed",
  "cancelled",
]);

export const salesOrders = pgTable(
  "sales_orders",
  {
    id: text("id").primaryKey(),
    soNo: text("so_no").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    status: salesOrderStatusEnum("status").default("draft").notNull(),
    orderDate: timestamp("order_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expectedDate: timestamp("expected_date", { withTimezone: true }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("sales_orders_so_no_unique", sql`${table.soNo} IS NOT NULL`)]
);

export const salesOrderItems = pgTable(
  "sales_order_items",
  {
    id: text("id").primaryKey(),
    soId: text("so_id")
      .notNull()
      .references(() => salesOrders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    qty: numeric("qty", { precision: 14, scale: 3, mode: "number" }).notNull(),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }),
    gstRate: numeric("gst_rate", { precision: 6, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    dispatchedQty: numeric("dispatched_qty", {
      precision: 14,
      scale: 3,
      mode: "number",
    }).default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("sales_order_items_qty_positive", sql`${table.qty} > 0`),
    check("sales_order_items_rate_non_negative", sql`${table.rate} >= 0`),
    check(
      "sales_order_items_dispatched_qty_non_negative",
      sql`${table.dispatchedQty} >= 0`
    ),
    check(
      "sales_order_items_dispatched_not_exceed_qty",
      sql`${table.dispatchedQty} <= ${table.qty}`
    ),
  ]
);

export const dispatchStatusEnum = pgEnum("dispatch_status", [
  "pending",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const dispatches = pgTable(
  "dispatches",
  {
    id: text("id").primaryKey(),
    dispatchNo: text("dispatch_no").notNull().unique(),
    soId: text("so_id")
      .notNull()
      .references(() => salesOrders.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    status: dispatchStatusEnum("status").default("pending").notNull(),
    dispatchDate: timestamp("dispatch_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expectedDeliveryDate: timestamp("expected_delivery_date", {
      withTimezone: true,
    }),
    actualDeliveryDate: timestamp("actual_delivery_date", {
      withTimezone: true,
    }),
    vehicleNo: text("vehicle_no"),
    driverName: text("driver_name"),
    driverPhone: text("driver_phone"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id),
    deliveredBy: text("delivered_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("dispatches_dispatch_no_unique", sql`${table.dispatchNo} IS NOT NULL`)]
);

export const dispatchItems = pgTable(
  "dispatch_items",
  {
    id: text("id").primaryKey(),
    dispatchId: text("dispatch_id")
      .notNull()
      .references(() => dispatches.id, { onDelete: "cascade" }),
    soItemId: text("so_item_id")
      .notNull()
      .references(() => salesOrderItems.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    qty: numeric("qty", { precision: 14, scale: 3, mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("dispatch_items_qty_positive", sql`${table.qty} > 0`)]
);

export type SalesOrderRow = typeof salesOrders.$inferSelect;
export type NewSalesOrderRow = typeof salesOrders.$inferInsert;
export type SalesOrderItemRow = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItemRow = typeof salesOrderItems.$inferInsert;
export type SalesOrderStatus =
  (typeof salesOrderStatusEnum.enumValues)[number];
export type DispatchRow = typeof dispatches.$inferSelect;
export type NewDispatchRow = typeof dispatches.$inferInsert;
export type DispatchItemRow = typeof dispatchItems.$inferSelect;
export type NewDispatchItemRow = typeof dispatchItems.$inferInsert;
export type DispatchStatus = (typeof dispatchStatusEnum.enumValues)[number];