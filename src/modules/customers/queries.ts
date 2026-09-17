import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, type Customer } from "./schema";

export async function listCustomers(opts?: { includeArchived?: boolean }): Promise<Customer[]> {
  return db
    .select()
    .from(customers)
    .where(opts?.includeArchived ? undefined : isNull(customers.archivedAt))
    .orderBy(asc(customers.name));
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row;
}