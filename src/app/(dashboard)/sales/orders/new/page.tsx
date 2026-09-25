"use client";

import { Suspense } from "react";
import { listCustomers } from "@/modules/customers/queries";
import { listProducts } from "@/modules/products/queries";
import { NewSalesOrderForm } from "./new-sales-order-form";

export default function NewSalesOrderPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>}>
      <NewSalesOrderFormSuspense />
    </Suspense>
  );
}

async function NewSalesOrderFormSuspense() {
  const [customers, products] = await Promise.all([
    listCustomers(),
    listProducts(),
  ]);

  const activeCustomers = customers.filter((c) => !c.archivedAt);
  const activeProducts = products.filter((p) => !p.archivedAt);

  return <NewSalesOrderForm customers={activeCustomers} products={activeProducts} />;
}