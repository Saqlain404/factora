import type { Metadata } from "next";
import { listMoulds } from "@/modules/moulds/queries";
import { listSuppliers } from "@/modules/suppliers/queries";
import { MouldsTable } from "./moulds-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Moulds" };

export default async function MouldsPage() {
  const [moulds, suppliers] = await Promise.all([listMoulds(), listSuppliers()]);
  return <MouldsTable moulds={moulds} suppliers={suppliers} />;
}