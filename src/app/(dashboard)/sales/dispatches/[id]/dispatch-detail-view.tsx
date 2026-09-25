"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

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
import { DISPATCH_STATUS } from "@/components/status/definitions";
import { formatDate } from "@/lib/utils";
import { updateDispatchStatus, cancelDispatch } from "@/modules/sales/dispatch-actions";
import type { DispatchWithDetails } from "@/modules/sales/dispatch-queries";

export function DispatchDetailView({ dispatch }: { dispatch: DispatchWithDetails }) {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const canDeliver = dispatch.status === "pending" || dispatch.status === "in_transit";
  const canMarkInTransit = dispatch.status === "pending";
  const canCancel = dispatch.status !== "delivered" && dispatch.status !== "cancelled";

  async function handleStatusChange(newStatus: "in_transit" | "delivered" | "cancelled") {
    setUpdatingStatus(newStatus);
    const result = await updateDispatchStatus({
      id: dispatch.id,
      status: newStatus,
      actualDeliveryDate: newStatus === "delivered" ? new Date().toISOString().slice(0, 10) : null,
    });
    setUpdatingStatus(null);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this dispatch? This will restore the outstanding quantities on the sales order.")) return;

    const result = await cancelDispatch({ id: dispatch.id });
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dispatch.dispatchNo}
        description={`SO: ${dispatch.soNo} · Customer: ${dispatch.customerName}`}
        actions={
          <>
            {canMarkInTransit && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("in_transit")}
                disabled={updatingStatus === "in_transit"}
              >
                {updatingStatus === "in_transit" ? "Updating..." : "Mark In Transit"}
              </Button>
            )}
            {canDeliver && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("delivered")}
                disabled={updatingStatus === "delivered"}
              >
                {updatingStatus === "delivered" ? "Delivering..." : "Mark Delivered"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={updatingStatus === "cancelled"}
              >
                {updatingStatus === "cancelled" ? "Cancelling..." : "Cancel"}
              </Button>
            )}
          </>
        }
        badge={
          <StatusBadge status={dispatch.status} map={DISPATCH_STATUS} showDot />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dispatch Items</CardTitle>
            <CardDescription>
              {dispatch.items.length} product{dispatch.items.length !== 1 ? "s" : ""} in this dispatch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">SO Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Already Disp.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">This Dispatch</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dispatch.items.map((item) => {
                    const remaining = Number(item.soItemQty) - Number(item.soItemDispatchedQty);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/products/${item.productId}`} className="font-medium underline-offset-4 hover:underline">
                            {item.productName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{item.productCode} · {item.unit}</p>
                        </td>
                        <td className="text-right px-4 py-3 num font-medium">{Number(item.soItemQty).toLocaleString()}</td>
                        <td className="text-right px-4 py-3 num">{Number(item.soItemDispatchedQty).toLocaleString()}</td>
                        <td className="text-right px-4 py-3 num font-semibold">{Number(item.qty).toLocaleString()}</td>
                        <td className="text-right px-4 py-3 num text-muted-foreground">{remaining.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispatch Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={dispatch.status} map={DISPATCH_STATUS} showDot />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Dispatch Date</dt>
                <dd className="mt-1 num">{formatDate(dispatch.dispatchDate)}</dd>
              </div>
              {dispatch.expectedDeliveryDate && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Expected Delivery</dt>
                  <dd className="mt-1 num">{formatDate(dispatch.expectedDeliveryDate)}</dd>
                </div>
              )}
              {dispatch.actualDeliveryDate && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Actual Delivery</dt>
                  <dd className="mt-1 num font-semibold text-success">{formatDate(dispatch.actualDeliveryDate)}</dd>
                </div>
              )}
              {dispatch.vehicleNo && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Vehicle</dt>
                  <dd className="mt-1 font-mono">{dispatch.vehicleNo}</dd>
                </div>
              )}
              {dispatch.driverName && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Driver</dt>
                  <dd className="mt-1">{dispatch.driverName}</dd>
                </div>
              )}
              {dispatch.driverPhone && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Driver Phone</dt>
                  <dd className="mt-1 font-mono">{dispatch.driverPhone}</dd>
                </div>
              )}
            </dl>

            {dispatch.notes && (
              <div className="pt-4 border-t">
                <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-sm">{dispatch.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related Sales Order</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <Link href={`/sales/orders/${dispatch.soId}`} className="font-medium underline-offset-4 hover:underline">
              {dispatch.soNo}
            </Link>
            <p className="text-sm text-muted-foreground">{dispatch.customerName}</p>
          </div>
          <Button variant="outline" size="sm" render={<Link href={`/sales/orders/${dispatch.soId}`} />}>
            View Order
          </Button>
        </CardContent>
      </Card>

      {dispatch.status === "delivered" && (
        <Card className="border-success/30">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="size-12 mx-auto text-success mb-3" />
            <h3 className="font-semibold text-lg">Dispatch Delivered</h3>
            <p className="text-muted-foreground mt-1">
              Inventory has been reduced. Sales order status updated.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}