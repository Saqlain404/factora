import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRawMaterialById } from "@/modules/raw-materials/queries";
import { getLedgerHistory } from "@/modules/inventory/queries";
import { LedgerHistoryView } from "./ledger-history-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const material = await getRawMaterialById(id);
  return { title: material ? `Ledger — ${material.name}` : "Ledger" };
}

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [material, history] = await Promise.all([
    getRawMaterialById(id),
    getLedgerHistory(id),
  ]);

  if (!material) notFound();

  return <LedgerHistoryView material={material} history={history} />;
}