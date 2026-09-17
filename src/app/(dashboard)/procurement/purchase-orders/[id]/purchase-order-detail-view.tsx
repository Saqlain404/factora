"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowDownToLine, BadgeCheck, ClipboardList, Package, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { PO_STATUS } from "@/components/status/definitions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { confirmPurchaseOrder } from "@/modules/procurement/actions";
import type { PurchaseOrderDetail, PurchaseOrderItemRow } from "@/modules/procurement/queries";

export function PurchaseOrderDetailView({
  detail,
}: {
  detail: PurchaseOrderDetail;
}) {
  const router = useRouter();
  const { order, items } = detail;
  const [confirming, setConfirming] = useState(false);

  const canConfirm = order.status === "draft";
  const canReceive = order.status === "confirmed" || order.status === "received";

  const totalOrdered = items.reduce((sum, item) => sum + item.qty, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalOutstanding = totalOrdered - totalReceived;
  const totalValue = items.reduce((sum, item) => sum + (item.qty ?? 0) * (item.rate ?? 0), 0);

  async function handleConfirm() {
    const result = await confirmPurchaseOrder(order.id);
    if (result.ok) {
      toast.success(`${order.poNo} confirmed`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<PurchaseOrderItemRow>[] = [
    {
      key: "materialName",
      label: "Material",
      sortable: true,
      sortValue: (row) => row.materialName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.materialName}</p>
          <p className="text-xs text-muted-foreground">{row.materialUnit}</p>
        </div>
      ),
    },
    {
      key: "qty",
      label: "Ordered",
      align: "right",
      sortable: true,
      sortValue: (row) => row.qty,
      render: (row) => <span className="num">{row.qty}</span>,
    },
    {
      key: "receivedQty",
      label: "Received",
      align: "right",
      sortable: true,
      sortValue: (row) => row.receivedQty,
      render: (row) => <span className="num">{row.receivedQty}</span>,
    },
    {
      key: "outstanding",
      label: "Outstanding",
      align: "right",
      render: (row) => {
        const outstanding = row.qty - row.receivedQty;
        return (
          <span className={outstanding > 0 ? "num font-medium text-warning" : "num text-muted-foreground"}>
            {outstanding}
          </span>
        );
      },
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
      sortable: true,
      sortValue: (row) => row.rate ?? 0,
      render: (row) => <span className="num">{row.rate != null ? formatCurrency(row.rate) : "—"}</span>,
    },
    {
      key: "gstRate",
      label: "GST",
      align: "right",
      hideOnMobile: true,
      render: (row) => <span className="num">{row.gstRate != null ? `${row.gstRate}%` : "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="num font-mono text-xl">{order.poNo}</span>
            <StatusBadge status={order.status} map={PO_STATUS} showDot />
          </span>
        }
        description={`${order.supplierName} · ordered ${formatDate(order.orderDate)}`}
        actions={
          <div className="flex gap-2">
            {canConfirm ? (
              <Button onClick={() => setConfirming(true)}>
                <BadgeCheck aria-hidden />
                Confirm Order
              </Button>
            ) : null}
            {canReceive ? (
              <Button
                variant="outline"
                render={<Link href={`/procurement/receipts/new?poId=${order.id}`} />}
              >
                <ArrowDownToLine aria-hidden />
                Record Receipt
              </Button>
            ) : null}
          </div>
        }
      />

      {order.notes ? (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {order.notes}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Items" value={items.length} icon={ClipboardList} />
        <MetricCard label="Total ordered" value={`${totalOrdered} qty`} icon={Package} tone="info" />
        <MetricCard
          label="Received"
          value={`${totalReceived} qty`}
          sub={totalOutstanding > 0 ? `${totalOutstanding} outstanding` : "fully received"}
          icon={Truck}
          tone={totalOutstanding > 0 ? "warning" : "success"}
        />
        <MetricCard label="Order value" value={formatCurrency(totalValue)} sub="qty × rate before GST" />
      </div>

      <DataTable
        data={items}
        columns={columns}
        rowKey={(row) => row.id}
        label="items"
        search={{ placeholder: "Search material…", keys: (row) => [row.materialName, row.materialUnit] }}
        empty={{ icon: Package, title: "No items on this order", description: "Add materials to this purchase order." }}
      />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Confirm ${order.poNo}?`}
        description="Confirms the order with the supplier. Receipts can be recorded against it afterwards (DEC-021)."
        confirmLabel="Confirm Order"
        onConfirm={handleConfirm}
      />
    </div>
  );
}