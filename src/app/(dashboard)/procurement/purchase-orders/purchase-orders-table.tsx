"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Clock3, CircleDashed, CheckCircle2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { PO_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import type { PurchaseOrderWithSupplier } from "@/modules/procurement/queries";

const ORDER_STATUSES = ["draft", "confirmed", "received", "closed"] as const;

export function PurchaseOrdersTable({
  orders,
}: {
  orders: PurchaseOrderWithSupplier[];
}) {
  const draftCount = orders.filter((order) => order.status === "draft").length;
  const confirmedCount = orders.filter((order) => order.status === "confirmed").length;
  const closedCount = orders.filter((order) => order.status === "closed").length;
  const [statusFilter, setStatusFilter] = useState("");

  const columns: Column<PurchaseOrderWithSupplier>[] = [
    {
      key: "poNo",
      label: "PO No.",
      sortable: true,
      sortValue: (row) => row.poNo,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.poNo}</Badge>,
    },
    {
      key: "supplierName",
      label: "Supplier",
      sortable: true,
      sortValue: (row) => row.supplierName,
      render: (row) => <span className="font-medium text-foreground">{row.supplierName}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (row) => ORDER_STATUSES.indexOf(row.status as (typeof ORDER_STATUSES)[number]),
      render: (row) => <StatusBadge status={row.status} map={PO_STATUS} showDot />,
    },
    {
      key: "orderDate",
      label: "Order date",
      sortable: true,
      sortValue: (row) => row.orderDate.toISOString(),
      render: (row) => <span className="num text-muted-foreground">{formatDate(row.orderDate)}</span>,
    },
    {
      key: "notes",
      label: "Notes",
      hideOnMobile: true,
      render: (row) => (
        <span className="line-clamp-1 max-w-56 text-muted-foreground">{row.notes || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Orders to suppliers. Receipts are recorded against confirmed orders (DEC-021)."
        actions={
          <Button render={<Link href="/procurement/purchase-orders/new" />}>
            <Plus aria-hidden />
            New Purchase Order
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total orders" value={orders.length} icon={FileText} />
        <MetricCard label="Draft" value={draftCount} sub="awaiting confirmation" icon={CircleDashed} tone={draftCount > 0 ? "warning" : "default"} />
        <MetricCard label="Confirmed" value={confirmedCount} sub="waiting for stock-in" icon={Clock3} tone={confirmedCount > 0 ? "info" : "default"} />
        <MetricCard label="Closed" value={closedCount} sub="fully received" icon={CheckCircle2} tone={closedCount > 0 ? "success" : "default"} />
      </div>

      <DataTable
        data={orders}
        columns={columns}
        rowKey={(row) => row.id}
        label="purchase orders"
        search={{ placeholder: "Search PO no., supplier, notes…", keys: (row) => [row.poNo, row.supplierName, row.notes ?? ""] }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: ORDER_STATUSES.map((status) => ({ value: status, label: PO_STATUS[status].label })),
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
        empty={{
          icon: FileText,
          title: "No purchase orders yet",
          description: "Create one to order raw material from a supplier.",
        }}
        getRowActions={(row) => (
          <Button variant="outline" size="sm" render={<Link href={`/procurement/purchase-orders/${row.id}`} />}>
            View
          </Button>
        )}
      />
    </div>
  );
}