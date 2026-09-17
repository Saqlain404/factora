import type { Metadata } from "next";
import { listBatches } from "@/modules/production/queries";
import { BatchesTable } from "./batches-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Production Batches" };

export default async function ProductionBatchesPage() {
  const batches = await listBatches();
  return <BatchesTable batches={batches} />;
}