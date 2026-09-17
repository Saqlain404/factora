"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { adjustStock } from "@/modules/inventory/actions";
import {
  adjustStockInputSchema,
  type AdjustStockInput,
} from "@/modules/inventory/schemas";
import type { StockBalanceRow } from "@/modules/inventory/queries";

export function AdjustStockDialog({
  row,
  onOpenChange,
}: {
  row: StockBalanceRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdjustStockInput>({
    resolver: typedZodResolver<AdjustStockInput>(adjustStockInputSchema),
    defaultValues: {
      rawMaterialId: row?.rawMaterialId ?? "",
      qty: undefined as unknown as number,
      note: "",
    },
  });

  async function onSubmit(values: AdjustStockInput) {
    setIsSubmitting(true);
    const result = await adjustStock(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(`Balance is now ${result.data.balanceAfter}`);
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={row != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {row?.name ?? ""}</DialogTitle>
          <DialogDescription>
            {row ? `Current balance: ${row.currentBalance} ${row.unit}` : ""}. Positive adds
            stock, negative removes it. A note is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Quantity (+/−)"
            htmlFor="adj-qty"
            error={errors.qty?.message}
            hint="Positive adds to stock, negative removes"
          >
            <Input
              id="adj-qty"
              type="number"
              step="any"
              placeholder="e.g. 10 or -5"
              {...register("qty")}
            />
          </Field>
          <Field label="Note" htmlFor="adj-note" error={errors.note?.message}>
            <Input
              id="adj-note"
              placeholder="Why is this adjustment being made?"
              {...register("note")}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}