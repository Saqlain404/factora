import type { Metadata } from "next";
import { listRawMaterials } from "@/modules/raw-materials/queries";
import { RawMaterialsTable } from "./raw-materials-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Raw Materials" };

export default async function RawMaterialsPage() {
  const rawMaterials = await listRawMaterials();
  return <RawMaterialsTable rawMaterials={rawMaterials} />;
}