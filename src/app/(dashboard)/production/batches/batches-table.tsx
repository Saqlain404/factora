"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Factory, PlayCircle, Plus, SquareCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { BATCH_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import type { BatchListItem } from "@/modules/production/queries";

const BATCH_STATUSES = ["in_progress", "completed", "cancelled"] as const;

export function BatchesTable({ batches }: { batches: BatchListItem[] }) {
  const [statusFilter, setStatusFilter] = useState("");
  const inProgressCount = batches.filter((batch) => batch.status === "in_progress").length;
  const completedCount = batches.filter((batch) => batch.status === "completed").length;
  const cancelledCount = batches.filter((batch) => batch.status === "cancelled").length;

  const columns: Column<BatchListItem>[] = [
    {
      key: "batchNo",
      label: "Batch",
      sortable: true,
      sortValue: (row) => row.batchNo,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.batchNo}</Badge>,
    },
    {
      key: "productName",
      label: "Product",
      sortable: true,
      sortValue: (row) => row.productName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.productName}</p>
          <p className="text-xs text-muted-foreground">{row.productCode} · {row.productUnit}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (row) => BATCH_STATUSES.indexOf(row.status as (typeof BATCH_STATUSES)[number]),
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} map={BATCH_STATUS} showDot />
          {row.status === "in_progress" && row.startedAt === null ? (
            <span className="text-xs text-muted-foreground">reserving</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "planQty",
      label: "Plan qty",
      align: "right",
      sortable: true,
      sortValue: (row) => row.planQty,
      render: (row) => <span className="num">{row.planQty}</span>,
    },
    {
      key: "okQty",
      label: "Good qty",
      align: "right",
      hideOnMobile: true,
      render: (row) => <span className="num">{row.okQty != null ? row.okQty : "—"}</span>,
    },
    {
      key: "machineName",
      label: "Machine",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{row.machineName}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      sortValue: (row) => row.createdAt.toISOString(),
      hideOnMobile: true,
      render: (row) => <span className="num text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Batches"
        description="Plan a run on one machine with an active mould. Material reservations are recorded at start, actuals + output at completion (R12 / DEC-020)."
        actions={
          <Button render={<Link href="/production/batches/new" />}>
            <Plus aria-hidden />
            New Batch
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total batches" value={batches.length} icon={ClipboardList} />
        <MetricCard
          label="In progress"
          value={inProgressCount}
          sub={inProgressCount > 0 ? "running or reserving" : "none running"}
          icon={Factory}
          tone={inProgressCount > 0 ? "info" : "default"}
        />
        <MetricCard label="Completed" value={completedCount} icon={SquareCheck} tone={completedCount > 0 ? "success" : "default"} />
        <MetricCard label="Cancelled" value={cancelledCount} icon={XCircle} tone={cancelledCount > 0 ? "warning" : "default"} />
      </div>

      <DataTable
        data={batches}
        columns={columns}
        rowKey={(row) => row.id}
        label="batches"
        search={{
          placeholder: "Search batch no., product, machine…",
          keys: (row) => [row.batchNo, row.productName, row.productCode, row.machineName, row.mouldName, row.notes ?? ""],
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: BATCH_STATUSES.map((status) => ({ value: status, label: BATCH_STATUS[status].label })),
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
        empty={{
          icon: Factory,
          title: "No batches yet",
          description: "Create a batch to start producing a product against its BOM.",
        }}
        getRowActions={(row) => (
          <Button variant="outline" size="sm" render={<Link href={`/production/batches/${row.id}`} />}>
            Open
          </Button>
        )}
      />
    </div>
  );
}