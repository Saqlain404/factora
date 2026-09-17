import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPurchaseOrderDetail } from "@/modules/procurement/queries";
import { PurchaseOrderDetailView } from "./purchase-order-detail-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Purchase Order" };

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPurchaseOrderDetail(id);
  if (!detail) notFound();
  return <PurchaseOrderDetailView detail={detail} />;
}