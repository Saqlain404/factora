import type { Metadata } from "next";
import { listConfirmedOrdersWithItems } from "@/modules/procurement/queries";
import { NewReceiptForm } from "./new-receipt-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New Purchase Receipt" };

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ poId?: string }>;
}) {
  const { poId } = await searchParams;
  const orders = await listConfirmedOrdersWithItems();
  return <NewReceiptForm orders={orders} initialPoId={poId ?? ""} />;
}