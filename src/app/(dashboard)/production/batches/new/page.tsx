import type { Metadata } from "next";
import { listProducts } from "@/modules/products/queries";
import { listMachines } from "@/modules/machines/queries";
import { listAllBom } from "@/modules/bom/queries";
import { listActiveMoulds } from "@/modules/production/queries";
import { NewBatchForm } from "./new-batch-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New Production Batch" };

export default async function NewProductionBatchPage() {
  const [products, machines, activeMoulds, bomRows] = await Promise.all([
    listProducts(),
    listMachines(),
    listActiveMoulds(),
    listAllBom(),
  ]);
  return (
    <NewBatchForm
      products={products}
      machines={machines}
      activeMoulds={activeMoulds}
      bomRows={bomRows}
    />
  );
}