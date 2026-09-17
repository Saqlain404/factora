import type { Metadata } from "next";
import { listSuppliers } from "@/modules/suppliers/queries";
import { SuppliersTable } from "./suppliers-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();
  return <SuppliersTable suppliers={suppliers} />;
}