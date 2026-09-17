"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field } from "@/components/master-data/form-field";
import { PageHeader } from "@/components/page-header";
import { cn } from "cn";
import { formatCurrency } from "@/lib/utils";
import { recordPurchaseReceipt } from "@/modules/procurement/actions";
import type { ConfirmedOrderWithItems } from "@/modules/procurement/queries";

type Line = {
  rawMaterialId: string;
  qty: string;
  rate: string;
  gstRate: string;
};

function makeLines(order: ConfirmedOrderWithItems | undefined): Line[] {
  if (!order) return [];
  return order.items.map((item) => ({
    rawMaterialId: item.rawMaterialId,
    qty: String(item.outstandingQty),
    rate: "",
    gstRate: "",
  }));
}

export function NewReceiptForm({
  orders,
  initialPoId,
}: {
  orders: ConfirmedOrderWithItems[];
  initialPoId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultPoId =
    initialPoId && orders.some((order) => order.id === initialPoId)
      ? initialPoId
      : orders[0]?.id ?? "";

  const [selectedPoId, setSelectedPoId] = useState(defaultPoId);
  const [lines, setLines] = useState<Line[]>(() => makeLines(orders.find((o) => o.id === defaultPoId)));
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedPoId);

  function handlePoChange(value: string | null) {
    if (value === null || value === selectedPoId) return;
    setSelectedPoId(value);
    setLines(makeLines(orders.find((order) => order.id === value)));
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  async function handleSubmit() {
    if (!selectedOrder) {
      toast.error("Select a purchase order");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one received line");
      return;
    }

    setIsSubmitting(true);
    const result = await recordPurchaseReceipt({
      poId: selectedOrder.id,
      lines: lines.map((line) => ({
        rawMaterialId: line.rawMaterialId,
        qty: line.qty ? Number(line.qty) : 0,
        rate: line.rate ? Number(line.rate) : undefined,
        gstRate: line.gstRate ? Number(line.gstRate) : undefined,
      })),
      billNo: billNo.trim() || undefined,
      billDate: billDate || undefined,
      receivedAt: receivedAt || undefined,
      note: note.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Receipt recorded — stock updated");
      router.push("/procurement/receipts");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Purchase Receipt"
        description="Book stock in against a confirmed purchase order. Only outstanding quantities can be received."
      />

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No confirmed purchase orders with outstanding quantities. Confirm a PO first.
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <>
          <div className="flex max-w-md items-center gap-2">
            <span className="text-sm text-muted-foreground">Purchase Order</span>
            <Select value={selectedPoId} onValueChange={handlePoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a PO" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.poNo} — {order.supplierName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Items to Receive</CardTitle>
              <CardDescription>
                {selectedOrder?.poNo ?? "—"} · quantities shown are outstanding
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Qty Received</TableHead>
                    <TableHead>Rate (₹)</TableHead>
                    <TableHead>GST %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => {
                    const orderItem = selectedOrder?.items.find(
                      (item) => item.rawMaterialId === line.rawMaterialId
                    );
                    const qtyError = Number(line.qty) <= 0;
                    return (
                      <TableRow key={line.rawMaterialId}>
                        <TableCell className="font-medium">
                          {orderItem?.materialName}{" "}
                          <span className="text-muted-foreground">({orderItem?.materialUnit})</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {orderItem?.outstandingQty}
                        </TableCell>
                        <TableCell className="w-32">
                          <Input
                            type="number"
                            step="any"
                            min={0}
                            value={line.qty}
                            aria-invalid={qtyError}
                            onChange={(event) =>
                              updateLine(index, { qty: event.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="w-32">
                          <Input
                            type="number"
                            step="any"
                            min={0}
                            placeholder="Rate"
                            value={line.rate}
                            onChange={(event) =>
                              updateLine(index, { rate: event.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="w-32">
                          <Input
                            type="number"
                            step="any"
                            min={0}
                            placeholder="GST %"
                            value={line.gstRate}
                            onChange={(event) =>
                              updateLine(index, { gstRate: event.target.value })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
              <CardDescription>Bill information is optional (DEC-022)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Received On" htmlFor="rcv-date">
                <Input
                  id="rcv-date"
                  type="date"
                  value={receivedAt}
                  onChange={(event) => setReceivedAt(event.target.value)}
                />
              </Field>
              <Field label="Bill No." htmlFor="rcv-bill-no" hint="Optional">
                <Input
                  id="rcv-bill-no"
                  placeholder="e.g. SUP-1024"
                  value={billNo}
                  onChange={(event) => setBillNo(event.target.value)}
                />
              </Field>
              <Field label="Bill Date" htmlFor="rcv-bill-date" hint="Optional">
                <Input
                  id="rcv-bill-date"
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor="rcv-notes" className="sm:col-span-3">
                <Textarea
                  id="rcv-notes"
                  placeholder="Optional notes"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <div className={cn(
            "grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-3",
            lines.some((line) => Number(line.qty) > 0) && "border-ring/40"
          )}>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Materials</p>
              <p className="num-tight font-heading text-xl font-semibold text-foreground">{lines.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Incoming quantity</p>
              <p className="num-tight font-heading text-xl font-semibold text-foreground">
                {lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Incoming value (pre-GST)</p>
              <p className="num-tight font-heading text-xl font-semibold text-foreground">
                {lines.some((line) => Number(line.rate) > 0)
                  ? formatCurrency(
                      lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.rate) || 0), 0)
                    )
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <ArrowDownToLine />
              {isSubmitting ? "Recording..." : "Record Receipt"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}