"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
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
import { formatCurrency } from "@/lib/utils";
import { typedZodResolver } from "@/lib/zod-resolver";
import { createSalesOrder } from "@/modules/sales/actions";
import {
  createSalesOrderInputSchema,
  type CreateSalesOrderInput,
} from "@/modules/sales/schemas";
import type { Customer } from "@/modules/customers/schema";
import type { Product } from "@/modules/products/schema";

export function NewSalesOrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: Product[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateSalesOrderInput>({
    resolver: typedZodResolver<CreateSalesOrderInput>(createSalesOrderInputSchema),
    defaultValues: {
      customerId: "",
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      notes: "",
      items: [
        {
          productId: "",
          qty: 0,
          rate: undefined,
          gstRate: undefined,
        },
      ],
    },
  });

  const lineValues = (useWatch({ control, name: "items" }) ?? []).map((line) => ({
    qty: Number(line.qty) || 0,
    rate: Number(line.rate) || 0,
  }));
  const totalQty = lineValues.reduce((sum, line) => sum + line.qty, 0);
  const totalValue = lineValues.reduce((sum, line) => sum + line.qty * line.rate, 0);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  async function onSubmit(values: CreateSalesOrderInput) {
    setIsSubmitting(true);
    const result = await createSalesOrder(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Sales order created");
      router.push("/sales/orders");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Sales Order"
        description="Create a sales order for a customer. It must be confirmed before dispatches can be recorded."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Customer and delivery intent</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Customer"
              htmlFor="so-customer"
              error={errors.customerId?.message}
              hint="Customer this order is for"
            >
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value)}
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
            <Field label="Order Date" htmlFor="so-order-date">
              <Input id="so-order-date" type="date" {...register("orderDate")} />
            </Field>
            <Field label="Expected Date" htmlFor="so-expected-date">
              <Input id="so-expected-date" type="date" {...register("expectedDate")} />
            </Field>
            <Field label="Notes" htmlFor="so-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="so-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Products being ordered</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  productId: "",
                  qty: 0,
                  rate: null,
                  gstRate: 0,
                })
              }
            >
              <Plus />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.items?.message && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
            {fields.map((field, index) => (
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
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Qty" error={errors.items?.[index]?.qty?.message}>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="0"
                      {...register(`items.${index}.qty`)}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Rate (₹)" error={errors.items?.[index]?.rate?.message}>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Optional"
                      {...register(`items.${index}.rate`)}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="GST %" error={errors.items?.[index]?.gstRate?.message}>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Optional"
                      {...register(`items.${index}.gstRate`)}
                    />
                  </Field>
                </div>
                <div className="col-span-2 flex justify-end">
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
            ))}
          </CardContent>
        </Card>

        <div className={cn(
          "grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-3",
          (lineValues.some((line) => line.qty > 0) || lineValues.some((line) => line.rate > 0)) && "border-ring/40"
        )}>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Lines</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">{fields.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total quantity</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">{totalQty}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Estimated value (pre-GST)</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">
              {totalValue > 0 ? formatCurrency(totalValue) : "—"}
            </p>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Sales Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}