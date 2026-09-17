import type { Metadata } from "next";
import { listMachines } from "@/modules/machines/queries";
import { MachinesTable } from "./machines-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Machines" };

export default async function MachinesPage() {
  const machines = await listMachines();
  return <MachinesTable machines={machines} />;
}