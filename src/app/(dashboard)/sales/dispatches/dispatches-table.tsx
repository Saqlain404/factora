"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, CircleDashed, Truck, CheckCircle2, Plus, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { DISPATCH_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import type { DispatchListItem } from "@/modules/sales/dispatch-queries";

const DISPATCH_STATUSES = ["pending", "in_transit", "delivered", "cancelled"] as const;

export function DispatchesTable({
  dispatches,
}: {
  dispatches: DispatchListItem[];
}) {
  const pendingCount = dispatches.filter((d) => d.status === "pending").length;
  const inTransitCount = dispatches.filter((d) => d.status === "in_transit").length;
  const deliveredCount = dispatches.filter((d) => d.status === "delivered").length;
  const [statusFilter, setStatusFilter] = useState("");

  const columns: Column<DispatchListItem>[] = [
    {
      key: "dispatchNo",
      label: "Dispatch No.",
      sortable: true,
      sortValue: (row) => row.dispatchNo,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.dispatchNo}</Badge>,
    },
    {
      key: "soNo",
      label: "SO No.",
      sortable: true,
      sortValue: (row) => row.soNo,
      render: (row) => (
        <Link href={`/sales/orders/${row.soId}`} className="num font-mono underline-offset-4 hover:underline">
          {row.soNo}
        </Link>
      ),
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
      sortValue: (row) => DISPATCH_STATUSES.indexOf(row.status as (typeof DISPATCH_STATUSES)[number]),
      render: (row) => <StatusBadge status={row.status} map={DISPATCH_STATUS} showDot />,
    },
    {
      key: "dispatchDate",
      label: "Dispatch date",
      sortable: true,
      sortValue: (row) => row.dispatchDate.toISOString(),
      render: (row) => <span className="num text-muted-foreground">{formatDate(row.dispatchDate)}</span>,
    },
    {
      key: "totalQty",
      label: "Total Qty",
      sortable: true,
      sortValue: (row) => row.totalQty,
      render: (row) => <span className="num font-medium">{row.totalQty.toLocaleString()}</span>,
    },
    {
      key: "itemCount",
      label: "Lines",
      sortable: true,
      sortValue: (row) => row.itemCount,
      render: (row) => <span className="text-muted-foreground">{row.itemCount}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatches"
        description="Outbound shipments to customers. Record dispatch when goods leave the factory."
        actions={
          <Button render={<Link href="/sales/dispatches/new" />}>
            <Plus aria-hidden />
            New Dispatch
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total dispatches" value={dispatches.length} icon={FileText} />
        <MetricCard label="Pending" value={pendingCount} sub="awaiting dispatch" icon={CircleDashed} tone={pendingCount > 0 ? "warning" : "default"} />
        <MetricCard label="In transit" value={inTransitCount} sub="on the way" icon={Truck} tone={inTransitCount > 0 ? "info" : "default"} />
        <MetricCard label="Delivered" value={deliveredCount} sub="completed" icon={CheckCircle2} tone={deliveredCount > 0 ? "success" : "default"} />
      </div>

      <DataTable
        data={dispatches}
        columns={columns}
        rowKey={(row) => row.id}
        label="dispatches"
        search={{ placeholder: "Search dispatch no., SO no., customer…", keys: (row) => [row.dispatchNo, row.soNo, row.customerName] }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: DISPATCH_STATUSES.map((status) => ({ value: status, label: DISPATCH_STATUS[status].label })),
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
        empty={{
          icon: Send,
          title: "No dispatches yet",
          description: "Create one when goods are shipped to a customer.",
        }}
        getRowActions={(row) => (
          <Button variant="outline" size="sm" render={<Link href={`/sales/dispatches/${row.id}`} />}>
            View
          </Button>
        )}
      />
    </div>
  );
}