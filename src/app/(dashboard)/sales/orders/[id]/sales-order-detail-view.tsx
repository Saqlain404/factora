"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { SO_STATUS } from "@/components/status/definitions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { confirmSalesOrder, cancelSalesOrder } from "@/modules/sales/actions";
import { createDispatch } from "@/modules/sales/dispatch-actions";
import type { SalesOrderWithDetails } from "@/modules/sales/queries";

export function SalesOrderDetailView({ order }: { order: SalesOrderWithDetails }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatingDispatch, setIsCreatingDispatch] = useState(false);

  const outstandingItems = order.items.filter(
    (item) => Number(item.qty) > Number(item.dispatchedQty)
  );

  async function handleConfirm() {
    setIsConfirming(true);
    const result = await confirmSalesOrder({ id: order.id });
    setIsConfirming(false);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this sales order?")) return;

    setIsCancelling(true);
    const result = await cancelSalesOrder({ id: order.id });
    setIsCancelling(false);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleCreateDispatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreatingDispatch(true);

    const formData = new FormData(e.currentTarget);
    const items: { soItemId: string; productId: string; qty: number }[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("items.") && key.endsWith(".qty")) {
        const index = key.split(".")[1];
        const qty = Number(value);
        if (qty > 0) {
          const soItemId = formData.get(`items.${index}.soItemId`) as string;
          const productId = formData.get(`items.${index}.productId`) as string;
          items.push({ soItemId, productId, qty });
        }
      }
    }

    if (items.length === 0) {
      alert("Please add at least one item to dispatch");
      setIsCreatingDispatch(false);
      return;
    }

    const dispatchDateStr = formData.get("dispatchDate") as string;
    const expectedDeliveryStr = formData.get("expectedDeliveryDate") as string;

    const result = await createDispatch({
      soId: order.id,
      customerId: order.customerId,
      dispatchDate: dispatchDateStr,
      expectedDeliveryDate: expectedDeliveryStr || null,
      vehicleNo: formData.get("vehicleNo") as string || null,
      driverName: formData.get("driverName") as string || null,
      driverPhone: formData.get("driverPhone") as string || null,
      notes: formData.get("notes") as string || null,
      items,
    });

    setIsCreatingDispatch(false);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  const canConfirm = order.status === "draft";
  const canCancel = order.status !== "completed" && order.status !== "cancelled";
  const canDispatch = order.status === "confirmed" || order.status === "partial";

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.soNo}
        description={`Customer: ${order.customerName} (${order.customerCode})`}
        actions={
          <>
            <Button variant="outline" size="sm" render={<Link href={`/sales/orders/${order.id}/edit`} />}>
              <Edit aria-hidden />
              Edit
            </Button>
            {canConfirm && (
              <Button size="sm" onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? "Confirming..." : "Confirm"}
              </Button>
            )}
            {canCancel && order.status !== "draft" && (
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Cancel"}
              </Button>
            )}
            {canDispatch && (
              <Button size="sm" render={<Link href={`/sales/dispatches/new?soId=${order.id}`} />}>
                <Send aria-hidden />
                Create Dispatch
              </Button>
            )}
          </>
        }
        badge={
          <StatusBadge status={order.status} map={SO_STATUS} showDot />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              {order.items.length} product{order.items.length !== 1 ? "s" : ""} in this order
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Ordered</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Dispatched</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Outstanding</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">GST %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/products/${item.productId}`} className="font-medium underline-offset-4 hover:underline">
                          {item.productName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.productCode} · {item.unit}</p>
                      </td>
                      <td className="text-right px-4 py-3 num font-medium">{Number(item.qty).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 num">{Number(item.dispatchedQty).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 num font-semibold">
                        {Number(item.outstandingQty).toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 num text-muted-foreground">
                        {item.rate ? formatCurrency(Number(item.rate)) : "—"}
                      </td>
                      <td className="text-right px-4 py-3 num text-muted-foreground">
                        {Number(item.gstRate).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={order.status} map={SO_STATUS} showDot />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Order Date</dt>
                <dd className="mt-1 num">{formatDate(order.orderDate)}</dd>
              </div>
              {order.expectedDate && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Expected Date</dt>
                  <dd className="mt-1 num">{formatDate(order.expectedDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1 num">{formatDate(order.createdAt)}</dd>
              </div>
            </dl>

            {order.notes && (
              <div className="pt-4 border-t">
                <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-sm">{order.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canDispatch && outstandingItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Create Dispatch</CardTitle>
              <CardDescription>Dispatch finished goods against this order</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Dispatch Date" htmlFor="dispatch-date">
                  <Input id="dispatch-date" type="date" name="dispatchDate" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </Field>
                <Field label="Expected Delivery" htmlFor="expected-delivery">
                  <Input id="expected-delivery" type="date" name="expectedDeliveryDate" />
                </Field>
                <Field label="Vehicle No." htmlFor="vehicle-no">
                  <Input id="vehicle-no" name="vehicleNo" placeholder="Optional" />
                </Field>
                <Field label="Driver" htmlFor="driver-name">
                  <Input id="driver-name" name="driverName" placeholder="Optional" />
                </Field>
              </div>
              <Field label="Driver Phone" htmlFor="driver-phone" className="sm:col-span-2">
                <Input id="driver-phone" name="driverPhone" type="tel" placeholder="Optional" />
              </Field>
              <Field label="Notes" htmlFor="dispatch-notes" className="sm:col-span-2">
                <Textarea id="dispatch-notes" name="notes" placeholder="Optional notes" rows={2} />
              </Field>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Dispatch Items</h4>
                <div className="space-y-3">
                  {outstandingItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                      <input type="hidden" name={`items.${item.id}.soItemId`} value={item.id} />
                      <input type="hidden" name={`items.${item.id}.productId`} value={item.productId} />
                      <div className="col-span-4">
                        <label className="text-xs font-medium text-muted-foreground">Product</label>
                        <p className="font-medium">{item.productName}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Outstanding</label>
                        <p className="num font-medium">{Number(item.outstandingQty).toLocaleString()} {item.unit}</p>
                      </div>
                      <div className="col-span-3">
                        <Field label="Dispatch Qty" htmlFor={`dispatch-qty-${item.id}`}>
                          <Input
                            id={`dispatch-qty-${item.id}`}
                            type="number"
                            step="any"
                            min={0}
                            max={Number(item.outstandingQty)}
                            name={`items.${item.id}.qty`}
                            placeholder="0"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={isCreatingDispatch}>
                  {isCreatingDispatch ? "Creating..." : "Create Dispatch"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {outstandingItems.length === 0 && order.status !== "cancelled" && (
        <Card className="border-success/30">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="size-12 mx-auto text-success mb-3" />
            <h3 className="font-semibold text-lg">All items fully dispatched</h3>
            <p className="text-muted-foreground mt-1">This sales order is complete.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-9 rounded-md border bg-background px-3 py-1.5 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}