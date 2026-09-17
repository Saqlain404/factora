"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/master-data/form-field";
import { typedZodResolver } from "@/lib/zod-resolver";
import { createProduct, updateProduct } from "@/modules/products/actions";
import {
  productInputSchema,
  type ProductInput,
} from "@/modules/products/schemas";
import type { ProductWithMould } from "@/modules/products/queries";
import type { Mould } from "@/modules/moulds/schema";

const UNITS = ["pcs", "set", "kg", "bag", "litre", "box", "roll"];

export function ProductFormDialog({
  open,
  onOpenChange,
  row,
  moulds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: ProductWithMould | null;
  moulds: Mould[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: typedZodResolver<ProductInput>(productInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          unit: row.unit,
          mouldId: row.mouldId ?? "",
          hsnCode: row.hsnCode ?? "",
          gstRate: row.gstRate,
          sellingPrice: row.sellingPrice,
          notes: row.notes ?? "",
        }
      : {
          name: "",
          unit: "pcs",
          mouldId: "",
          gstRate: 0,
          sellingPrice: 0,
        },
  });

  async function onSubmit(values: ProductInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateProduct({ ...values, id: row.id })
      : await createProduct(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Product updated" : "Product created");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            Finished products feed orders, BOMs, and invoices (later phases).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="prd-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="prd-name" placeholder="e.g. Bottle Cap 28mm" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="prd-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="prd-code" placeholder="PRD-CAP-28" disabled={!!row} {...register("code")} />
            </Field>
            <Field label="Unit" htmlFor="prd-unit" error={errors.unit?.message}>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="prd-unit" className="w-full">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Mould"
              htmlFor="prd-mould"
              error={errors.mouldId?.message}
              hint="Mould used to make this product (must be Active for production)"
            >
              <Controller
                control={control}
                name="mouldId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="prd-mould" className="w-full">
                      <SelectValue placeholder="Select mould (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {moulds.map((mould) => (
                        <SelectItem key={mould.id} value={mould.id}>
                          {mould.code} - {mould.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="HSN Code" htmlFor="prd-hsn" error={errors.hsnCode?.message}>
              <Input id="prd-hsn" placeholder="39235090" {...register("hsnCode")} />
            </Field>
            <Field label="GST Rate (%)" htmlFor="prd-gst" error={errors.gstRate?.message}>
              <Input id="prd-gst" type="number" min={0} max={100} step="0.01" {...register("gstRate")} />
            </Field>
            <Field label="Selling Price (₹)" htmlFor="prd-price" error={errors.sellingPrice?.message}>
              <Input id="prd-price" type="number" min={0} step="0.01" {...register("sellingPrice")} />
            </Field>
            <Field label="Notes" htmlFor="prd-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="prd-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}