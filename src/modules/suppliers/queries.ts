import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers, type Supplier } from "./schema";

export async function listSuppliers(opts?: { includeArchived?: boolean }): Promise<Supplier[]> {
  return db
    .select()
    .from(suppliers)
    .where(opts?.includeArchived ? undefined : isNull(suppliers.archivedAt))
    .orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return row;
}