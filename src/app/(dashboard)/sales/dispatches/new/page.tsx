"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSalesOrderById } from "@/modules/sales/queries";
import { listCustomers } from "@/modules/customers/queries";
import { NewDispatchForm } from "./new-dispatch-form";

export default function NewDispatchPage() {
  const searchParams = useSearchParams();
  const soId = searchParams.get("soId");

  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>}>
      <NewDispatchFormSuspense soId={soId ?? undefined} />
    </Suspense>
  );
}

async function NewDispatchFormSuspense({ soId }: { soId?: string }) {
  let order = null;
  if (soId) {
    order = await getSalesOrderById(soId);
  }
  const customers = await listCustomers();
  const activeCustomers = customers.filter((c) => !c.archivedAt);

  return <NewDispatchForm initialOrder={order} customers={activeCustomers} />;
}