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
import { createCustomer, updateCustomer } from "@/modules/customers/actions";
import {
  customerInputSchema,
  type CustomerInput,
} from "@/modules/customers/schemas";
import type { Customer } from "@/modules/customers/schema";

export function CustomerFormDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Customer | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: typedZodResolver<CustomerInput>(customerInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          contactPhone: row.contactPhone ?? "",
          email: row.email ?? "",
          gstin: row.gstin ?? "",
          state: row.state,
          stateCode: row.stateCode,
          address: row.address ?? "",
          creditPeriodDays: row.creditPeriodDays,
          notes: row.notes ?? "",
        }
      : {
          name: "",
          state: "Uttar Pradesh",
          stateCode: "09",
          creditPeriodDays: 30,
        },
  });

  async function onSubmit(values: CustomerInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateCustomer({ ...values, id: row.id })
      : await createCustomer(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Customer updated" : "Customer created");
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
          <DialogTitle>{row ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {row
              ? "Update customer details. Credit period is used for invoice due dates (DEC-018)."
              : "Set up a customer with their own credit period (DEC-018)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="cust-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="cust-name" placeholder="e.g. Amit Plastics" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="cust-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="cust-code" placeholder="CUST-0001" disabled={!!row} {...register("code")} />
            </Field>
            <Field label="Contact Phone" htmlFor="cust-phone" error={errors.contactPhone?.message}>
              <Input id="cust-phone" placeholder="98765 43210" {...register("contactPhone")} />
            </Field>
            <Field label="Email" htmlFor="cust-email" error={errors.email?.message}>
              <Input id="cust-email" type="email" placeholder="name@company.com" {...register("email")} />
            </Field>
            <Field label="GSTIN" htmlFor="cust-gstin" error={errors.gstin?.message}>
              <Input id="cust-gstin" placeholder="09ABCDE1234F1Z5" {...register("gstin")} />
            </Field>
            <Field label="State" htmlFor="cust-state" error={errors.state?.message}>
              <Input id="cust-state" placeholder="Uttar Pradesh" {...register("state")} />
            </Field>
            <Field label="State Code" htmlFor="cust-state-code" error={errors.stateCode?.message}>
              <Input id="cust-state-code" placeholder="09" {...register("stateCode")} />
            </Field>
            <Field
              label="Credit Period (days)"
              htmlFor="cust-credit"
              error={errors.creditPeriodDays?.message}
              hint="Days after which the invoice is due for this customer"
              className="sm:col-span-2"
            >
              <Input id="cust-credit" type="number" min={0} {...register("creditPeriodDays")} />
            </Field>
            <Field label="Address" htmlFor="cust-address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea id="cust-address" placeholder="Billing address" {...register("address")} />
            </Field>
            <Field label="Notes" htmlFor="cust-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="cust-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}