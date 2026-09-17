import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBatchById } from "@/modules/production/queries";
import { BatchDetailView } from "./batch-detail-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Production Batch" };

export default async function ProductionBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getBatchById(id);
  if (!detail) notFound();
  return <BatchDetailView detail={detail} />;
}