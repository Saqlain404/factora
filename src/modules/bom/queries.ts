import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { bomItems } from "./schema";

export type BomRow = {
  id: string;
  productId: string;
  rawMaterialId: string;
  materialName: string;
  materialUnit: string;
  qtyPerUnit: number;
};

export async function listBomForProduct(productId: string): Promise<BomRow[]> {
  return db
    .select({
      id: bomItems.id,
      productId: bomItems.productId,
      rawMaterialId: bomItems.rawMaterialId,
      materialName: rawMaterials.name,
      materialUnit: rawMaterials.unit,
      qtyPerUnit: bomItems.qtyPerUnit,
    })
    .from(bomItems)
    .innerJoin(rawMaterials, eq(rawMaterials.id, bomItems.rawMaterialId))
    .where(eq(bomItems.productId, productId))
    .orderBy(asc(rawMaterials.name));
}

export async function listAllBom(): Promise<BomRow[]> {
  return db
    .select({
      id: bomItems.id,
      productId: bomItems.productId,
      rawMaterialId: bomItems.rawMaterialId,
      materialName: rawMaterials.name,
      materialUnit: rawMaterials.unit,
      qtyPerUnit: bomItems.qtyPerUnit,
    })
    .from(bomItems)
    .innerJoin(rawMaterials, eq(rawMaterials.id, bomItems.rawMaterialId))
    .orderBy(asc(bomItems.productId), asc(rawMaterials.name));
}