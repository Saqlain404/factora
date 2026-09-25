import { notFound } from "next/navigation";
import { getSalesOrderById } from "@/modules/sales/queries";
import { SalesOrderDetailView } from "./sales-order-detail-view";

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getSalesOrderById(id);

  if (!order) {
    notFound();
  }

  return <SalesOrderDetailView order={order} />;
}