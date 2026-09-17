import "server-only";

import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "./schema";
import { moulds } from "@/modules/moulds/schema";

export type ProductWithMould = typeof products.$inferSelect & {
  mouldName: string | null;
};

export async function listProducts(opts?: { includeArchived?: boolean }): Promise<ProductWithMould[]> {
  return db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      unit: products.unit,
      mouldId: products.mouldId,
      mouldName: moulds.name,
      hsnCode: products.hsnCode,
      gstRate: products.gstRate,
      sellingPrice: products.sellingPrice,
      notes: products.notes,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      archivedAt: products.archivedAt,
    })
    .from(products)
    .leftJoin(moulds, eq(moulds.id, products.mouldId))
    .where(opts?.includeArchived ? undefined : isNull(products.archivedAt))
    .orderBy(asc(products.name));
}

export async function getProductById(id: string) {
  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      unit: products.unit,
      mouldId: products.mouldId,
      mouldName: moulds.name,
      hsnCode: products.hsnCode,
      gstRate: products.gstRate,
      sellingPrice: products.sellingPrice,
      notes: products.notes,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      archivedAt: products.archivedAt,
    })
    .from(products)
    .leftJoin(moulds, eq(moulds.id, products.mouldId))
    .where(eq(products.id, id))
    .limit(1);
  return row;
}