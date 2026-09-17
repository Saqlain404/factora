"use client";

import Link from "next/link";
import { ArrowDownToLine, CircleDollarSign, PackageCheck, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PurchaseReceiptRow } from "@/modules/procurement/queries";

export function PurchaseReceiptsTable({
  receipts,
}: {
  receipts: PurchaseReceiptRow[];
}) {
  const totalQty = receipts.reduce((sum, row) => sum + row.qty, 0);
  const totalValue = receipts.reduce((sum, row) => sum + row.qty * row.rate, 0);

  const columns: Column<PurchaseReceiptRow>[] = [
    {
      key: "receivedAt",
      label: "Received on",
      sortable: true,
      sortValue: (row) => row.receivedAt.toISOString(),
      render: (row) => <span className="num whitespace-nowrap text-muted-foreground">{formatDate(row.receivedAt)}</span>,
    },
    {
      key: "poNo",
      label: "PO",
      sortable: true,
      sortValue: (row) => row.poNo,
      render: (row) => (
        <Link
          href={`/procurement/purchase-orders/${row.poId}`}
          className="num font-mono text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.poNo}
        </Link>
      ),
    },
    {
      key: "supplierName",
      label: "Supplier",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{row.supplierName}</span>,
    },
    {
      key: "materialName",
      label: "Material",
      sortable: true,
      sortValue: (row) => row.materialName,
      render: (row) => <span className="font-medium text-foreground">{row.materialName}</span>,
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
      sortable: true,
      sortValue: (row) => row.qty,
      render: (row) => <span className="num font-medium">{row.qty}</span>,
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
      sortable: true,
      sortValue: (row) => row.rate,
      render: (row) => <span className="num">{formatCurrency(row.rate)}</span>,
    },
    {
      key: "gstRate",
      label: "GST",
      align: "right",
      hideOnMobile: true,
      render: (row) => <span className="num text-muted-foreground">{row.gstRate}%</span>,
    },
    {
      key: "billNo",
      label: "Bill No.",
      hideOnMobile: true,
      render: (row) => <span className="num text-muted-foreground">{row.billNo || "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Receipts"
        description="Stock-in movements. Every receipt writes a PURCHASE_RECEIPT ledger entry."
        actions={
          <Button render={<Link href="/procurement/receipts/new" />}>
            <ArrowDownToLine aria-hidden />
            New Receipt
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Receipt lines" value={receipts.length} icon={Receipt} />
        <MetricCard label="Total quantity" value={totalQty} sub="across all receipts" icon={PackageCheck} />
        <MetricCard label="Total value" value={formatCurrency(totalValue)} sub="qty × rate before GST" icon={CircleDollarSign} />
      </div>

      <DataTable
        data={receipts}
        columns={columns}
        rowKey={(row) => row.id}
        label="receipts"
        search={{ placeholder: "Search material, PO, supplier, bill no…", keys: (row) => [row.materialName, row.poNo, row.supplierName, row.billNo ?? ""] }}
        empty={{
          icon: ArrowDownToLine,
          title: "No receipts yet",
          description: "Record one against a confirmed purchase order.",
        }}
      />
    </div>
  );
}