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

export const mouldStatusEnum = pgEnum("mould_status", [
  "required",
  "ordered",
  "received",
  "trial",
  "active",
]);

export const moulds = pgTable(
  "moulds",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    status: mouldStatusEnum("status").default("required").notNull(),
    supplierId: text("supplier_id").references(() => suppliers.id),
    cost: numeric("cost", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    trialAt: timestamp("trial_at", { withTimezone: true }),
    activeAt: timestamp("active_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [check("moulds_cost_non_negative", sql`${table.cost} >= 0`)]
);

export type Mould = typeof moulds.$inferSelect;
export type NewMould = typeof moulds.$inferInsert;
export type MouldStatus = (typeof mouldStatusEnum.enumValues)[number];