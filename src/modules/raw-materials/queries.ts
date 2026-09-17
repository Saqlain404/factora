import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rawMaterials, type RawMaterial } from "./schema";

export async function listRawMaterials(opts?: { includeArchived?: boolean }): Promise<RawMaterial[]> {
  return db
    .select()
    .from(rawMaterials)
    .where(opts?.includeArchived ? undefined : isNull(rawMaterials.archivedAt))
    .orderBy(asc(rawMaterials.name));
}

export async function getRawMaterialById(id: string): Promise<RawMaterial | undefined> {
  const [row] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id)).limit(1);
  return row;
}