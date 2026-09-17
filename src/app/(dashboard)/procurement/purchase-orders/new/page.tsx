import type { Metadata } from "next";
import { listRawMaterials } from "@/modules/raw-materials/queries";
import { listSuppliers } from "@/modules/suppliers/queries";
import { NewPurchaseOrderForm } from "./new-purchase-order-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New Purchase Order" };

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string }>;
}) {
  const [{ material }, suppliers, rawMaterials] = await Promise.all([
    searchParams,
    listSuppliers(),
    listRawMaterials(),
  ]);
  return (
    <NewPurchaseOrderForm
      suppliers={suppliers}
      rawMaterials={rawMaterials}
      initialMaterialId={material}
    />
  );
}