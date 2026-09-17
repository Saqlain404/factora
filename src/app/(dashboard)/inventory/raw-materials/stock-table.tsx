"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, SlidersHorizontal, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { STOCK_LEVEL } from "@/components/status/definitions";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { cn } from "cn";
import { formatCurrency } from "@/lib/utils";
import type { StockBalanceRow } from "@/modules/inventory/queries";

export type StockLevel = "in_stock" | "low" | "empty";

function levelFor(row: { currentBalance: number; minStockQty: number }): StockLevel {
  if (row.currentBalance === 0) return "empty";
  if (row.currentBalance < row.minStockQty) return "low";
  return "in_stock";
}

export function StockTable({ stock }: { stock: StockBalanceRow[] }) {
  const [adjusting, setAdjusting] = useState<StockBalanceRow | null>(null);
  const [levelFilter, setLevelFilter] = useState("");

  const rows = useMemo(
    () =>
      stock.map((row) => ({
        ...row,
        level: levelFor(row) as StockLevel,
      })),
    [stock]
  );

  const lowCount = rows.filter((row) => row.level === "low").length;
  const emptyCount = rows.filter((row) => row.level === "empty").length;

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "name",
      label: "Material",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/inventory/raw-materials/${row.rawMaterialId}`}
            className="truncate font-medium text-foreground underline-offset-4 hover:underline"
          >
            {row.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            <span className="num font-mono">{row.code}</span>
            <span className="mx-1" aria-hidden>·</span>
            {row.unit}
          </p>
        </div>
      ),
    },
    {
      key: "currentBalance",
      label: "Quantity",
      align: "right",
      sortable: true,
      sortValue: (row) => row.currentBalance,
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className={cn("num font-medium", row.level !== "in_stock" && "text-warning")}>
            {row.currentBalance}
          </span>
          {row.level !== "in_stock" ? (
            <span className="text-[11px] text-muted-foreground">below min</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "minStockQty",
      label: "Min stock",
      align: "right",
      sortable: true,
      sortValue: (row) => row.minStockQty,
      render: (row) => <span className="num text-muted-foreground">{row.minStockQty}</span>,
    },
    {
      key: "currentRate",
      label: "Rate",
      align: "right",
      sortable: true,
      sortValue: (row) => row.currentRate,
      render: (row) => <span className="num">{formatCurrency(row.currentRate)}</span>,
    },
    {
      key: "level",
      label: "Status",
      render: (row) => <StatusBadge status={row.level} map={STOCK_LEVEL} showDot />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Live raw-material stock. Balance is the last ledger movement for the material."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Materials tracked"
          value={rows.length}
          sub={rows.length === 1 ? "raw material" : "raw materials"}
          icon={Boxes}
        />
        <MetricCard
          label="Below minimum"
          value={lowCount}
          sub="reorder to avoid stock-outs"
          icon={AlertTriangle}
          tone={lowCount > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="Out of stock"
          value={emptyCount}
          sub="balance at zero"
          icon={XCircle}
          tone={emptyCount > 0 ? "danger" : "success"}
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.rawMaterialId}
        label="materials"
        search={{ placeholder: "Search by name, code…", keys: (row) => [row.name, row.code] }}
        filters={[
          {
            key: "level",
            label: "Status",
            options: Object.entries(STOCK_LEVEL).map(([value, meta]) => ({
              value,
              label: meta.label,
            })),
            value: levelFilter,
            onValueChange: setLevelFilter,
          },
        ]}
        empty={{
          icon: Boxes,
          title: "No raw materials yet",
          description: "Add raw materials first — stock appears here once material is set up.",
        }}
        getRowActions={(row) => (
          <Button variant="outline" size="sm" onClick={() => setAdjusting(row)}>
            <SlidersHorizontal aria-hidden />
            Adjust
          </Button>
        )}
      />

      <AdjustStockDialog
        row={adjusting}
        onOpenChange={(open) => {
          if (!open) setAdjusting(null);
        }}
      />
    </div>
  );
}