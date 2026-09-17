import type { Metadata } from "next";
import { listProducts } from "@/modules/products/queries";
import { listRawMaterials } from "@/modules/raw-materials/queries";
import { listAllBom } from "@/modules/bom/queries";
import { BomEditor } from "./bom-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "BOM" };

export default async function BomPage() {
  const [products, rawMaterials, bomRows] = await Promise.all([
    listProducts(),
    listRawMaterials(),
    listAllBom(),
  ]);
  return (
    <BomEditor products={products} rawMaterials={rawMaterials} bomRows={bomRows} />
  );
}