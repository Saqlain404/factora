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
import { createMould, updateMould } from "@/modules/moulds/actions";
import { mouldInputSchema, type MouldInput } from "@/modules/moulds/schemas";
import type { MouldWithSupplier } from "@/modules/moulds/queries";
import type { Supplier } from "@/modules/suppliers/schema";

export function MouldFormDialog({
  open,
  onOpenChange,
  row,
  suppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: MouldWithSupplier | null;
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MouldInput>({
    resolver: typedZodResolver<MouldInput>(mouldInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          supplierId: row.supplierId ?? "",
          cost: row.cost,
          notes: row.notes ?? "",
        }
      : {
          name: "",
          supplierId: "",
          cost: 0,
        },
  });

  async function onSubmit(values: MouldInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateMould({ ...values, id: row.id })
      : await createMould(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Mould updated" : "Mould created");
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
          <DialogTitle>{row ? "Edit Mould" : "Add Mould"}</DialogTitle>
          <DialogDescription>
            Moulds follow the lifecycle Required → Ordered → Received → Trial → Active (DEC-015).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="mould-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="mould-name" placeholder="e.g. Cap Mould 28mm" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="mould-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="mould-code" placeholder="MOULD-001" disabled={!!row} {...register("code")} />
            </Field>
            <Field label="Supplier" htmlFor="mould-supplier" error={errors.supplierId?.message}>
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="mould-supplier" className="w-full">
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.code} - {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Cost (₹)"
              htmlFor="mould-cost"
              error={errors.cost?.message}
              hint="Mould development cost - billing to customers is unresolved (OQ-17)"
            >
              <Input id="mould-cost" type="number" min={0} step="0.01" {...register("cost")} />
            </Field>
            <Field label="Notes" htmlFor="mould-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="mould-notes" placeholder="Optional notes (trials, specs)" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Mould"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}