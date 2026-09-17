import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/modules/auth/schema";
import { products } from "@/modules/products/schema";
import { machines } from "@/modules/machines/schema";
import { moulds } from "@/modules/moulds/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";

export const batchStatusEnum = pgEnum("batch_status", [
  "in_progress",
  "completed",
  "cancelled",
]);

export const productionBatches = pgTable(
  "production_batches",
  {
    id: text("id").primaryKey(),
    batchNo: text("batch_no").notNull().unique(),
    orderId: text("order_id"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id),
    mouldId: text("mould_id")
      .notNull()
      .references(() => moulds.id),
    planQty: numeric("plan_qty", { precision: 14, scale: 3, mode: "number" })
      .notNull(),
    okQty: numeric("ok_qty", { precision: 14, scale: 3, mode: "number" }),
    rejectedQty: numeric("rejected_qty", {
      precision: 14,
      scale: 3,
      mode: "number",
    }),
    status: batchStatusEnum("status").default("in_progress").notNull(),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id),
    completedBy: text("completed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("production_batches_product_id_idx").on(table.productId),
    index("production_batches_status_idx").on(table.status),
    check("production_batches_plan_qty_positive", sql`${table.planQty} > 0`),
    check(
      "production_batches_ok_qty_non_negative",
      sql`${table.okQty} >= 0`
    ),
    check(
      "production_batches_rejected_qty_non_negative",
      sql`${table.rejectedQty} >= 0`
    ),
  ]
);

export const batchMaterials = pgTable(
  "batch_materials",
  {
    id: text("id").primaryKey(),
    batchId: text("batch_id")
      .notNull()
      .references(() => productionBatches.id, { onDelete: "cascade" }),
    rawMaterialId: text("raw_material_id")
      .notNull()
      .references(() => rawMaterials.id),
    plannedQty: numeric("planned_qty", {
      precision: 14,
      scale: 3,
      mode: "number",
    }).notNull(),
    reservedAt: timestamp("reserved_at", { withTimezone: true }),
    consumedQty: numeric("consumed_qty", {
      precision: 14,
      scale: 3,
      mode: "number",
    }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
  },
  (table) => [
    index("batch_materials_batch_id_idx").on(table.batchId),
    check("batch_materials_planned_qty_positive", sql`${table.plannedQty} > 0`),
    check(
      "batch_materials_consumed_qty_non_negative",
      sql`${table.consumedQty} >= 0`
    ),
  ]
);

export const batchCosts = pgTable(
  "batch_costs",
  {
    id: text("id").primaryKey(),
    batchId: text("batch_id")
      .notNull()
      .unique()
      .references(() => productionBatches.id, { onDelete: "cascade" }),
    materialCost: numeric("material_cost", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    labourCost: numeric("labour_cost", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    electricityCost: numeric("electricity_cost", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    mouldAllocation: numeric("mould_allocation", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    otherCosts: numeric("other_costs", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    total: numeric("total", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    enteredBy: text("entered_by").references(() => users.id),
    enteredAt: timestamp("entered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("batch_costs_total_matches_sum", sql`${table.total} = ${table.materialCost} + ${table.labourCost} + ${table.electricityCost} + ${table.mouldAllocation} + ${table.otherCosts}`),
    check("batch_costs_total_non_negative", sql`${table.total} >= 0`),
  ]
);

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type NewProductionBatch = typeof productionBatches.$inferInsert;
export type BatchMaterial = typeof batchMaterials.$inferSelect;
export type NewBatchMaterial = typeof batchMaterials.$inferInsert;
export type BatchCosts = typeof batchCosts.$inferSelect;
export type NewBatchCosts = typeof batchCosts.$inferInsert;
export type BatchStatus = (typeof batchStatusEnum.enumValues)[number];