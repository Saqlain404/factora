import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { machines, type Machine } from "./schema";

export async function listMachines(opts?: { includeArchived?: boolean }): Promise<Machine[]> {
  return db
    .select()
    .from(machines)
    .where(opts?.includeArchived ? undefined : isNull(machines.archivedAt))
    .orderBy(asc(machines.name));
}

export async function getMachineById(id: string): Promise<Machine | undefined> {
  const [row] = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
  return row;
}