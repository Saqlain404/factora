"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createSupplier, updateSupplier } from "@/modules/suppliers/actions";
import {
  supplierInputSchema,
  type SupplierInput,
} from "@/modules/suppliers/schemas";
import type { Supplier } from "@/modules/suppliers/schema";

export function SupplierFormDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Supplier | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: typedZodResolver<SupplierInput>(supplierInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          contactPhone: row.contactPhone ?? "",
          email: row.email ?? "",
          gstin: row.gstin ?? "",
          address: row.address ?? "",
          notes: row.notes ?? "",
        }
      : { name: "" },
  });

  async function onSubmit(values: SupplierInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateSupplier({ ...values, id: row.id })
      : await createSupplier(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Supplier updated" : "Supplier created");
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
          <DialogTitle>{row ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          <DialogDescription>
            Set up a supplier that purchase orders will reference (Phase 04).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="supp-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="supp-name" placeholder="e.g. Resin Distributors" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="supp-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="supp-code" placeholder="SUPP-0001" disabled={!!row} {...register("code")} />
            </Field>
            <Field label="Contact Phone" htmlFor="supp-phone" error={errors.contactPhone?.message}>
              <Input id="supp-phone" placeholder="98765 43210" {...register("contactPhone")} />
            </Field>
            <Field label="Email" htmlFor="supp-email" error={errors.email?.message}>
              <Input id="supp-email" type="email" placeholder="sales@company.com" {...register("email")} />
            </Field>
            <Field label="GSTIN" htmlFor="supp-gstin" error={errors.gstin?.message}>
              <Input id="supp-gstin" placeholder="09ABCDE1234F1Z5" {...register("gstin")} />
            </Field>
            <Field label="Address" htmlFor="supp-address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea id="supp-address" placeholder="Address" {...register("address")} />
            </Field>
            <Field label="Notes" htmlFor="supp-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="supp-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}