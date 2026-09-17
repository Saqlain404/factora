"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Boxes, CircleDollarSign, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { LEDGER_TYPES, STOCK_LEVEL } from "@/components/status/definitions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "cn";
import type { RawMaterial } from "@/modules/raw-materials/schema";
import type { LedgerHistoryRow } from "@/modules/inventory/queries";

type LedgerRow = LedgerHistoryRow & { level: "in_stock" | "low" | "empty" };

export function LedgerHistoryView({
  material,
  history,
}: {
  material: RawMaterial;
  history: LedgerHistoryRow[];
}) {
  const [typeFilter, setTypeFilter] = useState("");

  const rows: LedgerRow[] = useMemo(
    () =>
      history.map((entry) => ({
        ...entry,
        level:
          entry.balanceAfter === 0
            ? ("empty" as const)
            : entry.balanceAfter < material.minStockQty
              ? ("low" as const)
              : ("in_stock" as const),
      })),
    [history, material.minStockQty]
  );

  const currentBalance = rows[0]?.balanceAfter ?? 0;
  const level: LedgerRow["level"] =
    currentBalance === 0 ? "empty" : currentBalance < material.minStockQty ? "low" : "in_stock";

  const netIn =
    history.filter((entry) => entry.qty > 0).reduce((sum, entry) => sum + entry.qty, 0) -
    history.filter((entry) => entry.qty < 0).reduce((sum, entry) => sum + Math.abs(entry.qty), 0);

  const columns: Column<LedgerRow>[] = [
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      sortValue: (row) => row.createdAt.toISOString(),
      render: (row) => (
        <span className="num whitespace-nowrap text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => <StatusBadge status={row.type} map={LEDGER_TYPES} showDot={false} />,
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
      sortable: true,
      sortValue: (row) => row.qty,
      render: (row) => (
        <span className={cn("num", row.qty > 0 ? "text-success" : row.qty < 0 ? "text-destructive" : "text-muted-foreground")}>
          {row.qty > 0 ? "+" : ""}
          {row.qty}
        </span>
      ),
    },
    {
      key: "balanceAfter",
      label: "Balance",
      align: "right",
      sortable: true,
      sortValue: (row) => row.balanceAfter,
      render: (row) => <span className="num font-medium">{row.balanceAfter}</span>,
    },
    {
      key: "referenceType",
      label: "Reference",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{row.referenceType ?? "—"}</span>,
    },
    {
      key: "userName",
      label: "By",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{row.userName ?? "—"}</span>,
    },
    {
      key: "note",
      label: "Note",
      hideOnMobile: true,
      render: (row) => (
        <span className="line-clamp-1 max-w-56 text-muted-foreground">{row.note ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={material.name}
        description={
          <span>
            <span className="num font-mono text-xs">{material.code}</span>
            <span className="mx-2" aria-hidden>·</span>
            Unit: {material.unit}
            {material.hsnCode ? (
              <>
                <span className="mx-2" aria-hidden>·</span>
                HSN: <span className="num font-mono">{material.hsnCode}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <Button variant="outline" size="sm" render={<Link href="/inventory/raw-materials" />}>
            <ArrowLeft aria-hidden />
            Back to inventory
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Current balance"
          value={currentBalance}
          sub={`min stock ${material.minStockQty} ${material.unit}`}
          icon={Gauge}
        />
        <MetricCard
          label="Stock status"
          value={
            <div className="flex items-center gap-2 pt-0.5">
              <StatusBadge status={level} map={STOCK_LEVEL} showDot />
            </div>
          }
          sub={currentBalance < material.minStockQty ? "below the set minimum" : "at or above minimum"}
          icon={Boxes}
          tone={level === "empty" ? "danger" : level === "low" ? "warning" : "success"}
        />
        <MetricCard
          label="Current rate"
          value={formatCurrency(material.currentRate)}
          sub={material.gstRate != null ? `GST ${material.gstRate}%` : "no GST set"}
          icon={CircleDollarSign}
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        label="movements"
        search={{ placeholder: "Search type, reference, user, note…", keys: (row) => [row.type, row.note ?? "", row.userName ?? "", row.referenceType ?? ""] }}
        filters={[
          {
            key: "type",
            label: "Type",
            options: Object.entries(LEDGER_TYPES).map(([value, meta]) => ({
              value,
              label: meta.label,
            })),
            value: typeFilter,
            onValueChange: setTypeFilter,
          },
        ]}
        empty={{ icon: Boxes, title: "No movements yet", description: "Stock changes from receipts, production and adjustments will appear here." }}
      />

      <p className="text-xs text-muted-foreground">
        <span className="num">{history.length}</span> movement{history.length === 1 ? "" : "s"} · net change{" "}
        <span className={cn("num font-medium", netIn >= 0 ? "text-success" : "text-destructive")}>
          {netIn >= 0 ? "+" : ""}
          {netIn} {material.unit}
        </span>
      </p>
    </div>
  );
}