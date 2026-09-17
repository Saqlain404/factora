"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Cog, Factory, Layers3, Package } from "lucide-react";

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
import { typedZodResolver } from "@/lib/zod-resolver";
import { createBatch } from "@/modules/production/actions";
import {
  createBatchInputSchema,
  type CreateBatchInput,
} from "@/modules/production/schemas";
import type { ProductWithMould } from "@/modules/products/queries";
import type { Machine } from "@/modules/machines/schema";
import type { BomRow } from "@/modules/bom/queries";

type ActiveMould = { id: string; name: string; code: string };

function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function NewBatchForm({
  products,
  machines,
  activeMoulds,
  bomRows,
}: {
  products: ProductWithMould[];
  machines: Machine[];
  activeMoulds: ActiveMould[];
  bomRows: BomRow[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bomByProduct = new Map<string, BomRow[]>();
  for (const row of bomRows) {
    const current = bomByProduct.get(row.productId) ?? [];
    current.push(row);
    bomByProduct.set(row.productId, current);
  }

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateBatchInput>({
    resolver: typedZodResolver<CreateBatchInput>(createBatchInputSchema),
    defaultValues: {
      productId: "",
      machineId: "",
      mouldId: "",
      planQty: undefined as unknown as number,
      notes: "",
      materials: [],
    },
  });

  const materialLines = (useWatch({ control, name: "materials" }) ?? []).map(
    (line) => Number(line.plannedQty) || 0
  );
  const totalPlanned = materialLines.reduce((sum, qty) => sum + qty, 0);

  const { fields } = useFieldArray({
    control,
    name: "materials",
  });

  function handleProductChange(productId: string) {
    setValue("productId", productId);
    const product = products.find((item) => item.id === productId);
    const applicableMould =
      product?.mouldId && activeMoulds.some((mould) => mould.id === product.mouldId)
        ? product.mouldId
        : "";
    setValue("mouldId", applicableMould);

    const productBom = productId ? (bomByProduct.get(productId) ?? []) : [];
    const baseQty = Number(getValues("planQty")) || 0;
    setValue(
      "materials",
      productBom.map((row) => ({
        rawMaterialId: row.rawMaterialId,
        plannedQty: baseQty > 0 ? round3(row.qtyPerUnit * baseQty) : row.qtyPerUnit,
      }))
    );
  }

  async function onSubmit(values: CreateBatchInput) {
    setIsSubmitting(true);
    const result = await createBatch(values);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Batch created");
      router.push(`/production/batches/${result.data.id}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const hasBom = fields.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Production Batch"
        description="Plan a run on one machine (DEC-016) with an active mould (DEC-015). Plan qty is manual (DEC-023)."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Run Setup</CardTitle>
            <CardDescription>Product, machine and active mould</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Product"
              htmlFor="batch-product"
              error={errors.productId?.message}
              hint="Materials are prefilled from this product's BOM"
            >
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(value) => handleProductChange(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Machine"
              htmlFor="batch-machine"
              error={errors.machineId?.message}
              hint="One machine per batch (DEC-016)"
            >
              <Controller
                name="machineId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Mould"
              htmlFor="batch-mould"
              error={errors.mouldId?.message}
              hint="Only active moulds qualify (DEC-015) — prefilled from the product"
            >
              <Controller
                name="mouldId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={activeMoulds.length === 0 ? "No active moulds" : "Select a mould"} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMoulds.map((mould) => (
                        <SelectItem key={mould.id} value={mould.id}>
                          {mould.name} ({mould.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Plan qty"
              htmlFor="batch-plan-qty"
              error={errors.planQty?.message}
              hint="Manual target — prefilled from order when linking lands (DEC-023)"
            >
              <Input
                id="batch-plan-qty"
                type="number"
                step="any"
                min={0}
                placeholder="0"
                {...register("planQty")}
              />
            </Field>
            <Field label="Notes" htmlFor="batch-notes" className="sm:col-span-2">
              <Textarea id="batch-notes" placeholder="Optional notes" {...register("notes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserved Materials</CardTitle>
            <CardDescription>
              {hasBom
                ? "Prefilled from the product BOM; plan qty × qty per unit (R12). Planned quantities are editable."
                : "This product has no BOM yet — the batch will run with no material reservations."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.materials?.message ? (
              <p className="text-sm text-destructive">{errors.materials.message}</p>
            ) : null}
            {hasBom ? fields.map((field, index) => {
              const material = bomRows.find(
                (row) => row.rawMaterialId === (getValues(`materials.${index}.rawMaterialId`) ?? "")
              );
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-12 items-end gap-3 rounded-lg border p-3"
                >
                  <div className="col-span-8">
                    <Field label="Material" error={errors.materials?.[index]?.rawMaterialId?.message}>
                      <Input
                        value={material?.materialName ?? field.id}
                        readOnly
                        className="bg-muted/40 text-foreground"
                      />
                    </Field>
                  </div>
                  <div className="col-span-4">
                    <Field label={`Qty (${material?.materialUnit ?? ""})`} error={errors.materials?.[index]?.plannedQty?.message}>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="0"
                        {...register(`materials.${index}.plannedQty`)}
                      />
                    </Field>
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <Package className="size-4" aria-hidden />
                No materials required for this run.
              </div>
            )}
          </CardContent>
        </Card>

        <div className={cn(
          "grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-3",
          Number(getValues("planQty")) > 0 && "border-ring/40"
        )}>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Plan qty</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">
              <Controller
                name="planQty"
                control={control}
                render={({ field }) => (Number(field.value) > 0 ? field.value : "—")}
              />
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Materials</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">{fields.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total planned material</p>
            <p className="num-tight font-heading text-xl font-semibold text-foreground">
              {totalPlanned > 0 ? totalPlanned : "—"}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Batch"}
          </Button>
        </div>
      </form>
    </div>
  );
}