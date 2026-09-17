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
import { createRawMaterial, updateRawMaterial } from "@/modules/raw-materials/actions";
import {
  rawMaterialInputSchema,
  type RawMaterialInput,
} from "@/modules/raw-materials/schemas";
import type { RawMaterial } from "@/modules/raw-materials/schema";

const UNITS = ["kg", "bag", "litre", "piece", "set", "roll", "tonne"];

export function RawMaterialFormDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: RawMaterial | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RawMaterialInput>({
    resolver: typedZodResolver<RawMaterialInput>(rawMaterialInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          unit: row.unit,
          hsnCode: row.hsnCode ?? "",
          currentRate: row.currentRate,
          gstRate: row.gstRate,
          minStockQty: row.minStockQty,
          notes: row.notes ?? "",
        }
      : {
          name: "",
          unit: "kg",
          currentRate: 0,
          gstRate: 0,
          minStockQty: 0,
        },
  });

  async function onSubmit(values: RawMaterialInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateRawMaterial({ ...values, id: row.id })
      : await createRawMaterial(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Raw material updated" : "Raw material created");
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
          <DialogTitle>{row ? "Edit Raw Material" : "Add Raw Material"}</DialogTitle>
          <DialogDescription>
            Raw material (e.g. resin) definitions feed procurement and inventory (Phase 04/05).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="rm-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="rm-name" placeholder="e.g. Polypropylene Granules" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="rm-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="rm-code" placeholder="RM-PP-01" disabled={!!row} {...register("code")} />
            </Field>
            <Field label="Unit" htmlFor="rm-unit" error={errors.unit?.message}>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="rm-unit" className="w-full">
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
            <Field label="HSN Code" htmlFor="rm-hsn" error={errors.hsnCode?.message} hint="HSN used on invoices for GST (OQ-19)">
              <Input id="rm-hsn" placeholder="39021000" {...register("hsnCode")} />
            </Field>
            <Field label="Current Rate (₹)" htmlFor="rm-rate" error={errors.currentRate?.message}>
              <Input id="rm-rate" type="number" min={0} step="0.01" {...register("currentRate")} />
            </Field>
            <Field label="GST Rate (%)" htmlFor="rm-gst" error={errors.gstRate?.message}>
              <Input id="rm-gst" type="number" min={0} max={100} step="0.01" {...register("gstRate")} />
            </Field>
            <Field
              label="Min Stock Qty"
              htmlFor="rm-min"
              error={errors.minStockQty?.message}
              hint="Alerts for low stock (Phase 04/05)"
            >
              <Input id="rm-min" type="number" min={0} step="0.001" {...register("minStockQty")} />
            </Field>
            <Field label="Notes" htmlFor="rm-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="rm-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Raw Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}