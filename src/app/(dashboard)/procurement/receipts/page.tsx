import type { Metadata } from "next";
import { listPurchaseReceipts } from "@/modules/procurement/queries";
import { PurchaseReceiptsTable } from "./purchase-receipts-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Purchase Receipts" };

export default async function PurchaseReceiptsPage() {
  const receipts = await listPurchaseReceipts();
  return <PurchaseReceiptsTable receipts={receipts} />;
}