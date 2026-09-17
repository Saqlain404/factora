import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactPhone: text("contact_phone"),
  email: text("email"),
  gstin: text("gstin"),
  state: text("state").notNull().default("Uttar Pradesh"),
  stateCode: text("state_code").notNull().default("09"),
  address: text("address"),
  creditPeriodDays: integer("credit_period_days").notNull().default(30),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;