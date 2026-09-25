"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, CircleDashed, Package, Truck, CheckCircle2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { SO_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import type { SalesOrderWithCustomer } from "@/modules/sales/queries";

const SO_STATUSES = ["draft", "confirmed", "partial", "completed", "cancelled"] as const;

export function SalesOrdersTable({
  orders,
}: {
  orders: SalesOrderWithCustomer[];
}) {
  const draftCount = orders.filter((order) => order.status === "draft").length;
  const confirmedCount = orders.filter((order) => order.status === "confirmed").length;
  const partialCount = orders.filter((order) => order.status === "partial").length;
  const completedCount = orders.filter((order) => order.status === "completed").length;
  const [statusFilter, setStatusFilter] = useState("");

  const columns: Column<SalesOrderWithCustomer>[] = [
    {
      key: "soNo",
      label: "SO No.",
      sortable: true,
      sortValue: (row) => row.soNo,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.soNo}</Badge>,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      sortValue: (row) => row.customerName,
      render: (row) => <span className="font-medium text-foreground">{row.customerName}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (row) => SO_STATUSES.indexOf(row.status as (typeof SO_STATUSES)[number]),
      render: (row) => <StatusBadge status={row.status} map={SO_STATUS} showDot />,
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
        title="Sales Orders"
        description="Customer orders for finished products. Dispatches are recorded against confirmed orders."
        actions={
          <Button render={<Link href="/sales/orders/new" />}>
            <Plus aria-hidden />
            New Sales Order
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total orders" value={orders.length} icon={FileText} />
        <MetricCard label="Draft" value={draftCount} sub="awaiting confirmation" icon={CircleDashed} tone={draftCount > 0 ? "warning" : "default"} />
        <MetricCard label="Confirmed" value={confirmedCount} sub="ready to dispatch" icon={Package} tone={confirmedCount > 0 ? "info" : "default"} />
        <MetricCard label="Partial" value={partialCount} sub="partially dispatched" icon={Truck} tone={partialCount > 0 ? "warning" : "default"} />
        <MetricCard label="Completed" value={completedCount} sub="fully dispatched" icon={CheckCircle2} tone={completedCount > 0 ? "success" : "default"} />
      </div>

      <DataTable
        data={orders}
        columns={columns}
        rowKey={(row) => row.id}
        label="sales orders"
        search={{ placeholder: "Search SO no., customer, notes…", keys: (row) => [row.soNo, row.customerName, row.notes ?? ""] }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: SO_STATUSES.map((status) => ({ value: status, label: SO_STATUS[status].label })),
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
        empty={{
          icon: FileText,
          title: "No sales orders yet",
          description: "Create one to record a customer order for products.",
        }}
        getRowActions={(row) => (
          <Button variant="outline" size="sm" render={<Link href={`/sales/orders/${row.id}`} />}>
            View
          </Button>
        )}
      />
    </div>
  );
}