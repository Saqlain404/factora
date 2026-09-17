import type { Metadata } from "next";
import { listPurchaseOrders } from "@/modules/procurement/queries";
import { PurchaseOrdersTable } from "./purchase-orders-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Purchase Orders" };

export default async function PurchaseOrdersPage() {
  const orders = await listPurchaseOrders();
  return <PurchaseOrdersTable orders={orders} />;
}