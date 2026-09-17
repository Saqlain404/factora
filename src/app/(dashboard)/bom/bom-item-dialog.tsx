"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createBomItem, updateBomItem } from "@/modules/bom/actions";
import {
  bomItemInputSchema,
  type BomItemInput,
} from "@/modules/bom/schemas";
import type { BomRow } from "@/modules/bom/queries";
import type { RawMaterial } from "@/modules/raw-materials/schema";

export function BomItemDialog({
  open,
  onOpenChange,
  productId,
  row,
  availableMaterials,
  currentMaterialId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  row?: BomRow | null;
  availableMaterials: RawMaterial[];
  currentMaterialId: string | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BomItemInput>({
    resolver: typedZodResolver<BomItemInput>(bomItemInputSchema),
    defaultValues: row
      ? {
          productId,
          rawMaterialId: row.rawMaterialId,
          qtyPerUnit: row.qtyPerUnit,
        }
      : { productId, rawMaterialId: "", qtyPerUnit: undefined as unknown as number },
  });

  async function onSubmit(values: BomItemInput) {
    setIsSubmitting(true);
    const result = row
      ? await updateBomItem({ ...values, id: row.id })
      : await createBomItem(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(row ? "BOM item updated" : "Material added to BOM");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row ? "Edit BOM Item" : "Add BOM Material"}</DialogTitle>
          <DialogDescription>
            Quantity of the raw material required to make one unit of the product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Raw Material"
            htmlFor="bom-material"
            error={errors.rawMaterialId?.message}
          >
            <Controller
              name="rawMaterialId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? (currentMaterialId ?? "")}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label="Qty per Unit"
            htmlFor="bom-qty"
            error={errors.qtyPerUnit?.message}
            hint="How much of this material goes into one unit"
          >
            <Input
              id="bom-qty"
              type="number"
              step="any"
              min={0}
              placeholder="e.g. 0.5"
              {...register("qtyPerUnit")}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : row ? "Save Changes" : "Add to BOM"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}