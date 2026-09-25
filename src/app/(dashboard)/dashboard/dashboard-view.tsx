"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  FileText,
  Factory,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
  Send,
  ClipboardList,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DISPATCH_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import type { StockBalanceRow } from "@/modules/inventory/queries";
import type { PurchaseOrderWithSupplier } from "@/modules/procurement/queries";
import type { ConfirmedOrderWithItems } from "@/modules/procurement/queries";
import type { PurchaseReceiptRow } from "@/modules/procurement/queries";
import type { SalesOrderWithCustomer } from "@/modules/sales/queries";
import type { DispatchListItem } from "@/modules/sales/dispatch-queries";

type AttentionItem =
  | { kind: "low-stock"; material: StockBalanceRow }
  | { kind: "draft"; order: PurchaseOrderWithSupplier }
  | { kind: "outstanding"; order: ConfirmedOrderWithItems }
  | { kind: "draft-so"; order: SalesOrderWithCustomer }
  | { kind: "pending-dispatch"; order: DispatchListItem };

type DashboardData = {
  counts: {
    customers: number;
    suppliers: number;
    products: number;
    materials: number;
    machines: number;
    moulds: number;
  };
  salesCounts: { draft: number; active: number; completed: number };
  dispatchCounts: { pending: number; inTransit: number; delivered: number };
  stock: StockBalanceRow[];
  draftOrders: PurchaseOrderWithSupplier[];
  activeOrders: PurchaseOrderWithSupplier[];
  outstandingOrders: ConfirmedOrderWithItems[];
  recentReceipts: PurchaseReceiptRow[];
  draftSalesOrders: SalesOrderWithCustomer[];
  activeSalesOrders: SalesOrderWithCustomer[];
  recentDispatches: DispatchListItem[];
};

export function DashboardView(data: DashboardData) {
  const lowStock = data.stock
    .filter((row) => row.currentBalance < row.minStockQty)
    .sort((a, b) => a.currentBalance / a.minStockQty - b.currentBalance / b.minStockQty);
  const emptyStock = lowStock.filter((row) => row.currentBalance === 0).length;

  const outstandingLines = data.outstandingOrders.reduce(
    (total, order) => total + order.items.filter((item) => item.outstandingQty > 0).length,
    0
  );

  const pendingDispatchLines = data.recentDispatches.reduce(
    (total, d) => total + d.itemCount,
    0
  );

  const attentionItems: AttentionItem[] = [
    ...lowStock.map(
      (row): AttentionItem => ({ kind: "low-stock", material: row })
    ),
    ...data.draftOrders.map(
      (order): AttentionItem => ({ kind: "draft", order })
    ),
    ...data.outstandingOrders.map(
      (order): AttentionItem => ({ kind: "outstanding", order })
    ),
    ...data.draftSalesOrders.map(
      (order): AttentionItem => ({ kind: "draft-so", order })
    ),
    ...data.recentDispatches
      .filter((d) => d.status === "pending")
      .map(
        (d): AttentionItem => ({ kind: "pending-dispatch", order: d })
      ),
  ].slice(0, 8);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
            {" · "}
            {attentionItems.length > 0
              ? `${attentionItems.length} item${attentionItems.length > 1 ? "s" : ""} need your attention today.`
              : "Everything looks good — no open items right now."}
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/inventory/raw-materials" />} className="hidden sm:inline-flex">
          View stock
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-8">
        <MetricCard
          label="Low stock"
          value={lowStock.length}
          sub={emptyStock > 0 ? `${emptyStock} completely out of stock` : "Materials below minimum"}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? "warning" : "success"}
          href="/inventory/raw-materials"
        />
        <MetricCard
          label="Awaiting stock-in"
          value={data.outstandingOrders.length}
          sub={`${outstandingLines} open receipt line${outstandingLines === 1 ? "" : "s"}`}
          icon={Truck}
          tone={data.outstandingOrders.length > 0 ? "info" : "success"}
          href="/procurement/purchase-orders"
        />
        <MetricCard
          label="Draft POs"
          value={data.draftOrders.length}
          sub={data.draftOrders.length > 0 ? "Waiting for confirmation" : "No pending confirmations"}
          icon={FileText}
          href="/procurement/purchase-orders"
        />
        <MetricCard
          label="Active POs"
          value={data.activeOrders.length}
          sub="Confirmed or partially received"
          icon={Boxes}
          href="/procurement/purchase-orders"
        />
        <MetricCard
          label="Draft SOs"
          value={data.draftSalesOrders.length}
          sub={data.draftSalesOrders.length > 0 ? "Waiting for confirmation" : "No pending confirmations"}
          icon={ClipboardList}
          href="/sales/orders"
        />
        <MetricCard
          label="Active SOs"
          value={data.activeSalesOrders.length}
          sub="Confirmed or partially dispatched"
          icon={Package}
          href="/sales/orders"
        />
        <MetricCard
          label="Pending dispatches"
          value={data.dispatchCounts.pending}
          sub={`${pendingDispatchLines} line${pendingDispatchLines === 1 ? "" : "s"} to ship`}
          icon={Send}
          tone={data.dispatchCounts.pending > 0 ? "warning" : "success"}
          href="/sales/dispatches"
        />
        <MetricCard
          label="In transit"
          value={data.dispatchCounts.inTransit}
          sub="Shipped, awaiting delivery"
          icon={Truck}
          tone={data.dispatchCounts.inTransit > 0 ? "info" : "success"}
          href="/sales/dispatches"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>
                What to action first — low stock, unconfirmed orders, outstanding receipts and pending dispatches.
              </CardDescription>
            </div>
            {attentionItems.length > 0 ? (
              <Badge variant="secondary" className="num">{attentionItems.length}</Badge>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {attentionItems.length === 0 ? (
              <EmptyState
                compact
                icon={AlertTriangle}
                title="Nothing needs your attention"
                description="No low-stock materials, draft orders, outstanding receipts or pending dispatches right now."
              />
            ) : (
              <ul className="divide-y">
                {attentionItems.map((item) => {
                  if (item.kind === "low-stock" && item.material) {
                    const material = item.material;
                    return (
                      <li key={`stock-${material.rawMaterialId}`} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusBadge tone={material.currentBalance === 0 ? "danger" : "warning"} label={material.currentBalance === 0 ? "Out" : "Low"} showDot />
                          <div className="min-w-0">
                            <Link href={`/inventory/raw-materials/${material.rawMaterialId}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                              {material.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              <span className="num">{material.currentBalance}</span> {material.unit} left · minimum{" "}
                              <span className="num">{material.minStockQty}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={`/procurement/purchase-orders/new?material=${material.rawMaterialId}`} />
                          }
                          className="shrink-0"
                        >
                          Create PO
                        </Button>
                      </li>
                    );
                  }
                  if (item.kind === "draft" && item.order) {
                    const order = item.order;
                    return (
                      <li key={`draft-${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusBadge tone="neutral" label="Draft PO" showDot />
                          <div className="min-w-0">
                            <Link href={`/procurement/purchase-orders/${order.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                              {order.poNo}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{order.supplierName}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/procurement/purchase-orders/${order.id}`} />}
                          className="shrink-0"
                        >
                          Confirm
                        </Button>
                      </li>
                    );
                  }
                  if (item.kind === "outstanding" && item.order) {
                    const order = item.order;
                    return (
                      <li key={`out-${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusBadge tone="warning" label="Outstanding" showDot />
                          <div className="min-w-0">
                            <Link href={`/procurement/purchase-orders/${order.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                              {order.poNo}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {order.items.filter((i) => i.outstandingQty > 0).length} line(s) not yet received
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/procurement/receipts/new?poId=${order.id}`} />}
                          className="shrink-0"
                        >
                          Receive
                        </Button>
                      </li>
                    );
                  }
                  if (item.kind === "draft-so" && item.order) {
                    const order = item.order;
                    return (
                      <li key={`draft-so-${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusBadge tone="neutral" label="Draft SO" showDot />
                          <div className="min-w-0">
                            <Link href={`/sales/orders/${order.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                              {order.soNo}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{order.customerName}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/sales/orders/${order.id}`} />}
                          className="shrink-0"
                        >
                          Confirm
                        </Button>
                      </li>
                    );
                  }
                  if (item.kind === "pending-dispatch" && item.order) {
                    const dispatch = item.order;
                    return (
                      <li key={`pending-disp-${dispatch.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusBadge tone="warning" label="Pending dispatch" showDot />
                          <div className="min-w-0">
                            <Link href={`/sales/dispatches/${dispatch.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                              {dispatch.dispatchNo}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {dispatch.customerName} · {dispatch.itemCount} line(s)
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/sales/dispatches/${dispatch.id}`} />}
                          className="shrink-0"
                        >
                          Ship
                        </Button>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory health</CardTitle>
            <CardDescription>Stock level vs. minimum for every material.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.stock.map((row) => {
              const ratio = row.minStockQty > 0 ? row.currentBalance / row.minStockQty : 1;
              const pct = Math.min(100, Math.round(ratio * 100));
              const level = row.currentBalance <= 0 ? "empty" : ratio < 1 ? "low" : "in_stock";
              return (
                <div key={row.rawMaterialId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <Link
                      href={`/inventory/raw-materials/${row.rawMaterialId}`}
                      className="truncate font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="num text-xs text-muted-foreground">
                        {row.currentBalance} / {row.minStockQty} {row.unit}
                      </span>
                      <StatusBadge
                        tone={level === "empty" ? "danger" : level === "low" ? "warning" : "success"}
                        label={level === "empty" ? "Out" : level === "low" ? "Low" : "Ok"}
                        showDot
                      />
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.name} stock level`}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={level === "empty" ? "h-full bg-destructive" : level === "low" ? "h-full bg-warning" : "h-full bg-success"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent purchases</CardTitle>
              <CardDescription>Stock-in from supplier receipts.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/procurement/receipts" />}>
              View all
              <ArrowRight aria-hidden className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentReceipts.length === 0 ? (
              <EmptyState
                compact
                icon={Truck}
                title="No receipts recorded yet"
                description="Once you record a purchase receipt, it will show up here."
              />
            ) : (
              <ul className="divide-y">
                {data.recentReceipts.map((receipt) => (
                  <li key={receipt.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <Link
                        href={`/procurement/purchase-orders/${receipt.poId}`}
                        className="num shrink-0 font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {receipt.poNo}
                      </Link>
                      <span className="truncate text-muted-foreground">
                        {receipt.materialName}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="num font-medium text-foreground">+{receipt.qty}</span>
                      <span className="hidden sm:inline">{formatDate(receipt.receivedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent dispatches</CardTitle>
              <CardDescription>Outbound shipments to customers.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/sales/dispatches" />}>
              View all
              <ArrowRight aria-hidden className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentDispatches.length === 0 ? (
              <EmptyState
                compact
                icon={Send}
                title="No dispatches recorded yet"
                description="Once you record a dispatch, it will show up here."
              />
            ) : (
              <ul className="divide-y">
                {data.recentDispatches.map((dispatch) => (
                  <li key={dispatch.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <Link
                        href={`/sales/dispatches/${dispatch.id}`}
                        className="num shrink-0 font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {dispatch.dispatchNo}
                      </Link>
                      <span className="truncate text-muted-foreground">
                        {dispatch.customerName}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <StatusBadge status={dispatch.status} map={DISPATCH_STATUS} showDot />
                      <span className="hidden sm:inline">{formatDate(dispatch.dispatchDate)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Master data</CardTitle>
            <CardDescription>Registered records across the business.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <MasterLink href="/customers" icon={<Users className="size-4" />} label="Customers" value={data.counts.customers} />
            <MasterLink href="/suppliers" icon={<ShoppingCart className="size-4" />} label="Suppliers" value={data.counts.suppliers} />
            <MasterLink href="/products" icon={<Package className="size-4" />} label="Products" value={data.counts.products} />
            <MasterLink href="/raw-materials" icon={<Boxes className="size-4" />} label="Materials" value={data.counts.materials} />
            <MasterLink href="/machines" icon={<Factory className="size-4" />} label="Machines" value={data.counts.machines} />
            <MasterLink href="/moulds" icon={<Wrench className="size-4" />} label="Moulds" value={data.counts.moulds} />
            <MasterLink href="/sales/orders" icon={<ClipboardList className="size-4" />} label="Sales Orders" value={data.salesCounts.draft + data.salesCounts.active + data.salesCounts.completed} />
            <MasterLink href="/sales/dispatches" icon={<Send className="size-4" />} label="Dispatches" value={data.dispatchCounts.pending + data.dispatchCounts.inTransit + data.dispatchCounts.delivered} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MasterLink({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg border p-3 transition-colors hover:border-ring/40 hover:bg-accent/40"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="num block font-heading text-lg leading-tight font-semibold">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}