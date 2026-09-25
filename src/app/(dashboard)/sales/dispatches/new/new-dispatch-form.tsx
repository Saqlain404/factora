"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/master-data/form-field";
import { cn } from "cn";
import { typedZodResolver } from "@/lib/zod-resolver";
import { createDispatch } from "@/modules/sales/dispatch-actions";
import {
  createDispatchInputSchema,
  type CreateDispatchInput,
} from "@/modules/sales/dispatch-schemas";
import type { Customer } from "@/modules/customers/schema";
import type { SalesOrderWithDetails } from "@/modules/sales/queries";
import { getSalesOrderDispatchableItems } from "@/modules/sales/dispatch-queries";

interface DispatchableItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  qty: number;
  dispatchedQty: number;
  outstandingQty: number;
  rate: number | null;
  gstRate: number;
}

export function NewDispatchForm({
  initialOrder,
  customers,
}: {
  initialOrder: SalesOrderWithDetails | null;
  customers: Customer[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchableItems, setDispatchableItems] = useState<DispatchableItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateDispatchInput>({
    resolver: typedZodResolver<CreateDispatchInput>(createDispatchInputSchema),
    defaultValues: {
      soId: initialOrder?.id ?? "",
      customerId: initialOrder?.customerId ?? "",
      dispatchDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: "",
      vehicleNo: "",
      driverName: "",
      driverPhone: "",
      notes: "",
      items: [],
    },
  });

  const watchedSoId = watch("soId");

  useEffect(() => {
    if (watchedSoId) {
      loadDispatchableItems(watchedSoId);
    } else {
      setDispatchableItems([]);
    }
  }, [watchedSoId, loadDispatchableItems]);

  async function loadDispatchableItems(soId: string) {
    setLoadingItems(true);
    try {
      const items = await getSalesOrderDispatchableItems(soId);
      const typedItems: DispatchableItem[] = items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        unit: item.unit,
        qty: Number(item.qty),
        dispatchedQty: Number(item.dispatchedQty),
        outstandingQty: Number(item.outstandingQty),
        rate: item.rate ?? null,
        gstRate: Number(item.gstRate),
      }));
      setDispatchableItems(typedItems);

      const currentItems = watch("items") ?? [];
      if (currentItems.length === 0 && typedItems.length > 0) {
        for (const item of typedItems) {
          append({
            soItemId: item.id,
            productId: item.productId,
            qty: 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load dispatchable items:", error);
    } finally {
      setLoadingItems(false);
    }
  }

  const lineValues = (watch("items") ?? []).map((line) => ({
    qty: Number(line.qty) || 0,
  }));
  const totalQty = lineValues.reduce((sum, line) => sum + line.qty, 0);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  async function onSubmit(values: CreateDispatchInput) {
    setIsSubmitting(true);
    const result = await createDispatch(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Dispatch created");
      router.push("/sales/dispatches");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Dispatch"
        description="Record a dispatch of finished goods to a customer. Inventory will be reduced on delivery."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Details</CardTitle>
            <CardDescription>Sales order and delivery information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Sales Order"
              htmlFor="dispatch-so"
              error={errors.soId?.message}
              hint="Select a confirmed or partially dispatched order"
            >
              <Controller
                name="soId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!!initialOrder}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialOrder ? (
                        <SelectItem key={initialOrder.id} value={initialOrder.id}>
                          {initialOrder.soNo} — {initialOrder.customerName}
                        </SelectItem>
                      ) : (
                        ""
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Customer" htmlFor="dispatch-customer" error={errors.customerId?.message}>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!!initialOrder}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Dispatch Date" htmlFor="dispatch-date">
              <Input id="dispatch-date" type="date" {...register("dispatchDate")} />
            </Field>
            <Field label="Expected Delivery" htmlFor="expected-delivery">
              <Input id="expected-delivery" type="date" {...register("expectedDeliveryDate")} />
            </Field>
            <Field label="Vehicle No." htmlFor="vehicle-no" error={errors.vehicleNo?.message}>
              <Input id="vehicle-no" placeholder="Optional" {...register("vehicleNo")} />
            </Field>
            <Field label="Driver Name" htmlFor="driver-name" error={errors.driverName?.message}>
              <Input id="driver-name" placeholder="Optional" {...register("driverName")} />
            </Field>
            <Field label="Driver Phone" htmlFor="driver-phone" error={errors.driverPhone?.message}>
              <Input id="driver-phone" type="tel" placeholder="Optional" {...register("driverPhone")} />
            </Field>
            <Field label="Notes" htmlFor="dispatch-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="dispatch-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Products being dispatched</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.items?.message && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
            {loadingItems ? (
              <div className="text-center py-8 text-muted-foreground">Loading available items…</div>
            ) : dispatchableItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items available for dispatch. Select a sales order with outstanding items.
              </div>
            ) : (
              <>
                {fields.map((field, index) => {
                  const itemValue = watch(`items.${index}`);
                  const soItemId = itemValue?.soItemId;
                  const matchingItem = soItemId
                    ? dispatchableItems.find((i) => i.id === soItemId)
                    : null;

                  return (
                    <div key={field.id} className="grid grid-cols-12 items-end gap-3 rounded-lg border p-3">
                      <div className="col-span-4">
                        <Field label="Product" error={errors.items?.[index]?.productId?.message}>
                          <Controller
                            name={`items.${index}.productId`}
                            control={control}
                            render={({ field: productField }) => (
                              <Select
                                value={productField.value ?? ""}
                                onValueChange={(value) => productField.onChange(value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dispatchableItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.productName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="Outstanding" error={errors.items?.[index]?.qty?.message}>
                          <Input
                            type="text"
                            value={matchingItem
                              ? `${matchingItem.outstandingQty.toLocaleString()} ${matchingItem.unit}`
                              : "—"}
                            readOnly
                            className="bg-muted"
                          />
                        </Field>
                      </div>
                      <div className="col-span-3">
                        <Field label="Dispatch Qty" error={errors.items?.[index]?.qty?.message}>
                          <Input
                            type="number"
                            step="any"
                            min={0}
                            max={matchingItem?.outstandingQty ?? undefined}
                            placeholder="0"
                            {...register(`items.${index}.qty`)}
                          />
                        </Field>
                      </div>
                      <input type="hidden" name={`items.${index}.soItemId`} value={watch(`items.${index}.soItemId`) ?? ""} />
                      <div className="col-span-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(index)}
                          aria-label="Remove line"
                          disabled={fields.length <= 1}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {fields.length === 0 && dispatchableItems.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      for (const item of dispatchableItems) {
                        append({
                          soItemId: item.id,
                          productId: item.id,
                          qty: undefined as unknown as number,
                        });
                      }
                    }}
                  >
                    <Plus />
                    Add All Outstanding Items
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className={cn(
          "grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-3",
          totalQty > 0 && "border-ring/40"
        )}>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Lines</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">{fields.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total quantity</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">{totalQty}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || fields.length === 0}>
            {isSubmitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </div>
      </form>
    </div>
  );
}