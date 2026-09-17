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
import { createPurchaseOrder } from "@/modules/procurement/actions";
import {
  purchaseOrderInputSchema,
  type PurchaseOrderInput,
} from "@/modules/procurement/schemas";
import type { Supplier } from "@/modules/suppliers/schema";
import type { RawMaterial } from "@/modules/raw-materials/schema";

export function NewPurchaseOrderForm({
  suppliers,
  rawMaterials,
  initialMaterialId,
}: {
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  initialMaterialId?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prefillMaterial =
    initialMaterialId && rawMaterials.some((material) => material.id === initialMaterialId)
      ? initialMaterialId
      : "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PurchaseOrderInput>({
    resolver: typedZodResolver<PurchaseOrderInput>(purchaseOrderInputSchema),
    defaultValues: {
      supplierId: "",
      orderDate: new Date().toISOString().slice(0, 10),
      notes: "",
      items: [
        {
          rawMaterialId: prefillMaterial,
          qty: undefined as unknown as number,
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

  async function onSubmit(values: PurchaseOrderInput) {
    setIsSubmitting(true);
    const result = await createPurchaseOrder(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Purchase order created");
      router.push("/procurement/purchase-orders");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Purchase Order"
        description="Draft a PO against a supplier. It must be confirmed before receipts can be recorded."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Supplier and delivery intent</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Supplier"
              htmlFor="po-supplier"
              error={errors.supplierId?.message}
              hint="Supplier this order is placed with"
            >
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Order Date" htmlFor="po-order-date">
              <Input id="po-order-date" type="date" {...register("orderDate")} />
            </Field>
            <Field label="Notes" htmlFor="po-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="po-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Raw materials being ordered</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  rawMaterialId: "",
                  qty: undefined as unknown as number,
                  rate: undefined,
                  gstRate: undefined,
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
                  <Field label="Material" error={errors.items?.[index]?.rawMaterialId?.message}>
                    <Controller
                      name={`items.${index}.rawMaterialId`}
                      control={control}
                      render={({ field: materialField }) => (
                        <Select
                          value={materialField.value ?? ""}
                          onValueChange={(value) => materialField.onChange(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
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
            {isSubmitting ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}