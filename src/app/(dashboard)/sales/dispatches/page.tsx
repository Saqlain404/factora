import type { Metadata } from "next";
import { getDispatches } from "@/modules/sales/dispatch-queries";
import { DispatchesTable } from "./dispatches-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dispatches" };

export default async function DispatchesPage() {
  const dispatches = await getDispatches();
  return <DispatchesTable dispatches={dispatches} />;
}