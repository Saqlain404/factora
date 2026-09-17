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
import { createMachine, updateMachine } from "@/modules/machines/actions";
import {
  machineInputSchema,
  type MachineInput,
} from "@/modules/machines/schemas";
import type { Machine } from "@/modules/machines/schema";

export function MachineFormDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Machine | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MachineInput>({
    resolver: typedZodResolver<MachineInput>(machineInputSchema),
    defaultValues: row
      ? {
          name: row.name,
          code: row.code,
          capacity: row.capacity ?? undefined,
          notes: row.notes ?? "",
        }
      : { name: "" },
  });

  async function onSubmit(values: MachineInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateMachine({ ...values, id: row.id })
      : await createMachine(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "Machine updated" : "Machine created");
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
          <DialogTitle>{row ? "Edit Machine" : "Add Machine"}</DialogTitle>
          <DialogDescription>
            Every production batch requires exactly one machine (DEC-016).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="mch-name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="mch-name" placeholder="e.g. Injection Machine 80T" {...register("name")} />
            </Field>
            <Field
              label="Code"
              htmlFor="mch-code"
              error={errors.code?.message}
              hint={row ? "Business code cannot be changed" : "Optional - auto-generated if blank"}
            >
              <Input id="mch-code" placeholder="MCH-001" disabled={!!row} {...register("code")} />
            </Field>
            <Field
              label="Capacity"
              htmlFor="mch-capacity"
              error={errors.capacity?.message}
              hint="e.g. tonnage (T)"
            >
              <Input id="mch-capacity" type="number" min={0} step="0.001" {...register("capacity")} />
            </Field>
            <Field label="Notes" htmlFor="mch-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="mch-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Create Machine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}