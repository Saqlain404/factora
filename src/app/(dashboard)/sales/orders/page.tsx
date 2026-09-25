import type { Metadata } from "next";
import { getSalesOrders } from "@/modules/sales/queries";
import { SalesOrdersTable } from "./sales-orders-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sales Orders" };

export default async function SalesOrdersPage() {
  const orders = await getSalesOrders();
  return <SalesOrdersTable orders={orders} />;
}