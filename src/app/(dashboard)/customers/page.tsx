import type { Metadata } from "next";
import { listCustomers } from "@/modules/customers/queries";
import { CustomersTable } from "./customers-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const customers = await listCustomers();
  return <CustomersTable customers={customers} />;
}