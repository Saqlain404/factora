import type { Metadata } from "next";
import { getStockBalances } from "@/modules/inventory/queries";
import { StockTable } from "./stock-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const stock = await getStockBalances();
  return <StockTable stock={stock} />;
}