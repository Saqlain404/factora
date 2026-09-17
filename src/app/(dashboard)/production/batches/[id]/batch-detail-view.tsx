"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeIndianRupee,
  CalendarClock,
  CircleDollarSign,
  Coins,
  Package,
  PlayCircle,
  Recycle,
  SquareCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatusBadge } from "@/components/status/status-badge";
import { BATCH_STATUS, BATCH_STARTED } from "@/components/status/definitions";
import { Field } from "@/components/master-data/form-field";
import { cn } from "cn";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { typedZodResolver } from "@/lib/zod-resolver";
import {
  startBatch,
  completeBatch,
  cancelBatch,
  recordBatchCosts,
} from "@/modules/production/actions";
import {
  completeBatchInputSchema,
  batchCostsInputSchema,
  type CompleteBatchInput,
  type BatchCostsInput,
} from "@/modules/production/schemas";
import { batchCostsTotal } from "@/modules/production/domain";
import type { BatchDetail, BatchMaterialRow } from "@/modules/production/queries";

function useRefreshRouter() {
  const router = useRouter();
  return router;
}

export function BatchDetailView({ detail }: { detail: BatchDetail }) {
  const router = useRefreshRouter();
  const { batch, materials, costs } = detail;
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [costsOpen, setCostsOpen] = useState(false);

  const isRunning = batch.status === "in_progress";
  const isStarted = batch.startedAt !== null;
  const totalConsumed = materials.reduce(
    (sum, material) => sum + (material.consumedQty ?? 0),
    0
  );
  const totalReturned = materials.reduce(
    (sum, material) => sum + Math.max(0, material.plannedQty - (material.consumedQty ?? 0)),
    0
  );

  async function handleStart() {
    setStarting(true);
    const result = await startBatch({ batchId: batch.id });
    setStarting(false);
    if (result.ok) {
      toast.success(`${batch.batchNo} started — materials reserved`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleCancel() {
    const result = await cancelBatch({ batchId: batch.id });
    if (result.ok) {
      toast.success(`${batch.batchNo} cancelled`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const materialColumns: Column<BatchMaterialRow>[] = [
    {
      key: "materialName",
      label: "Material",
      sortable: true,
      sortValue: (row) => row.materialName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.materialName}</p>
          <p className="text-xs text-muted-foreground">{row.materialUnit}</p>
        </div>
      ),
    },
    {
      key: "plannedQty",
      label: "Planned",
      align: "right",
      sortable: true,
      sortValue: (row) => row.plannedQty,
      render: (row) => <span className="num">{row.plannedQty}</span>,
    },
    {
      key: "reservedAt",
      label: "Reserved",
      align: "right",
      render: (row) =>
        row.reservedAt ? (
          <span className="num text-muted-foreground">{formatDateTime(row.reservedAt)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "consumedQty",
      label: "Consumed",
      align: "right",
      sortable: true,
      sortValue: (row) => row.consumedQty ?? 0,
      render: (row) => <span className="num">{row.consumedQty ?? "—"}</span>,
    },
    {
      key: "returned",
      label: "Returned",
      align: "right",
      hideOnMobile: true,
      render: (row) => {
        const unused = row.returnedAt !== null ? Math.max(0, row.plannedQty - (row.consumedQty ?? 0)) : 0;
        return (
          <span className={unused > 0 ? "num font-medium text-success" : "num text-muted-foreground"}>
            {unused > 0 ? unused : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="num font-mono text-xl">{batch.batchNo}</span>
            <StatusBadge status={batch.status} map={BATCH_STATUS} showDot />
          </span>
        }
        description={`${batch.productName} (${batch.productCode} · ${batch.productUnit}) · ${batch.machineName} · mould ${batch.mouldName}`}
        actions={
          <div className="flex gap-2">
            {isRunning && !isStarted ? (
              <Button onClick={handleStart} disabled={starting}>
                <PlayCircle aria-hidden />
                {starting ? "Starting..." : "Start Batch"}
              </Button>
            ) : null}
            {isRunning && isStarted ? (
              <>
                <Button onClick={() => setCompleteOpen(true)}>
                  <SquareCheck aria-hidden />
                  Complete Batch
                </Button>
                <Button variant="outline" onClick={() => setCancelling(true)}>
                  <XCircle aria-hidden />
                  Cancel
                </Button>
              </>
            ) : null}
            {batch.status !== "cancelled" ? (
              <Button variant="outline" onClick={() => setCostsOpen(true)}>
                <BadgeIndianRupee aria-hidden />
                {costs ? "Update Costs" : "Record Costs"}
              </Button>
            ) : null}
          </div>
        }
      />

      {batch.notes ? (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {batch.notes}
        </div>
      ) : null}

      {batch.orderId ? (
        <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
          Linked to order <span className="num font-mono text-foreground">{batch.orderId}</span> (orders phase pending)
        </div>
      ) : null}

      {batch.status === "in_progress" && !isStarted ? (
        <div className="rounded-xl border border-ring/40 bg-info/10 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Reserving:</span> materials are set aside
          on this batch. Reservation is bookkeeping only — stock does not move until completion
          (R12 / DEC-024).
        </div>
      ) : null}

      {batch.status === "completed" ? (
        <div className="rounded-xl border border-ring/40 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Costing note:</span> rejected output and
          extra consumption are absorbed into this batch's costs (DEC-011 / DEC-024). Good output
          was posted to finished-goods stock (DEC-020).
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Plan qty" value={batch.planQty} icon={CalendarClock} tone="info" />
        <MetricCard
          label="Good output"
          value={batch.okQty ?? "—"}
          sub={batch.rejectedQty != null ? `${batch.rejectedQty} rejected (absorbed)` : undefined}
          icon={SquareCheck}
          tone={batch.okQty != null && batch.okQty > 0 ? "success" : "default"}
        />
        <MetricCard label="Materials" value={materials.length} sub={totalConsumed > 0 ? `${totalConsumed} consumed` : undefined} icon={Package} />
        <MetricCard
          label="Batch cost"
          value={costs ? formatCurrency(costs.total) : "—"}
          sub={costs ? "manual entry (DEC-025)" : "not recorded yet"}
          icon={CircleDollarSign}
          tone={costs ? "success" : "default"}
        />
      </div>

      <DataTable
        data={materials}
        columns={materialColumns}
        rowKey={(row) => row.id}
        label="materials"
        search={{ placeholder: "Search material…", keys: (row) => [row.materialName, row.materialUnit] }}
        empty={{
          icon: Package,
          title: "No reserved materials",
          description: "This batch runs with no BOM — nothing to consume on completion.",
        }}
      />

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        tone="danger"
        title={`Cancel ${batch.batchNo}?`}
        description="Reservations are bookkeeping only, so nothing moves. The batch is marked cancelled and can no longer be completed."
        confirmLabel="Cancel Batch"
        onConfirm={handleCancel}
      />

      <CompleteBatchDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        batchId={batch.id}
        batchNo={batch.batchNo}
        planQty={batch.planQty}
        materials={materials}
      />

      <CostsDialog
        open={costsOpen}
        onOpenChange={setCostsOpen}
        batchId={batch.id}
        batchNo={batch.batchNo}
        initial={costs}
      />
    </div>
  );
}

function CompleteBatchDialog({
  open,
  onOpenChange,
  batchId,
  batchNo,
  planQty,
  materials,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchNo: string;
  planQty: number;
  materials: BatchMaterialRow[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompleteBatchInput>({
    resolver: typedZodResolver<CompleteBatchInput>(completeBatchInputSchema),
    defaultValues: {
      batchId,
      okQty: planQty,
      rejectedQty: 0,
      consumption: materials.map((material) => ({
        rawMaterialId: material.rawMaterialId,
        consumedQty: material.plannedQty,
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: "consumption" });

  async function onSubmit(values: CompleteBatchInput) {
    setIsSubmitting(true);
    const result = await completeBatch(values);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(`${batchNo} completed — output posted to stock`);
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <ConfirmDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Complete ${batchNo}`}
      description="Enter actual output and consumption. Over-consumption folds into costs; unused reservations are returned (DEC-024)."
      confirmLabel={isSubmitting ? "Completing..." : "Complete Batch"}
      onConfirm={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Good qty" error={errors.okQty?.message}>
            <Input type="number" step="any" min={0} placeholder="0" {...register("okQty")} />
          </Field>
          <Field label="Rejected qty" error={errors.rejectedQty?.message}>
            <Input type="number" step="any" min={0} placeholder="0" {...register("rejectedQty")} />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Actual consumption</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {fields.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No materials reserved — nothing to consume.
              </p>
            ) : (
              fields.map((field, index) => {
                const material = materials.find((m) => m.id === field.id);
                return (
                  <div key={field.id} className="grid grid-cols-12 items-end gap-3 rounded-lg border p-3">
                    <div className="col-span-8">
                      <p className="text-sm font-medium text-foreground">
                        {material?.materialName ?? "Material"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        planned {material?.plannedQty ?? "—"} {material?.materialUnit}
                      </p>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="0"
                        aria-label="consumed quantity"
                        {...register(`consumption.${index}.consumedQty`)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {errors.consumption?.message ? (
          <p className="text-sm text-destructive">{errors.consumption.message}</p>
        ) : null}
      </div>
    </ConfirmDialogShell>
  );
}

function CostsDialog({
  open,
  onOpenChange,
  batchId,
  batchNo,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchNo: string;
  initial: BatchDetail["costs"];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BatchCostsInput>({
    resolver: typedZodResolver<BatchCostsInput>(batchCostsInputSchema),
    defaultValues: {
      batchId,
      materialCost: initial?.materialCost ?? 0,
      labourCost: initial?.labourCost ?? 0,
      electricityCost: initial?.electricityCost ?? 0,
      mouldAllocation: initial?.mouldAllocation ?? 0,
      otherCosts: initial?.otherCosts ?? 0,
    },
  });

  const values = watch();
  const total = batchCostsTotal({
    materialCost: Number(values.materialCost) || 0,
    labourCost: Number(values.labourCost) || 0,
    electricityCost: Number(values.electricityCost) || 0,
    mouldAllocation: Number(values.mouldAllocation) || 0,
    otherCosts: Number(values.otherCosts) || 0,
  });

  async function onSubmit(formValues: BatchCostsInput) {
    setIsSubmitting(true);
    const result = await recordBatchCosts(formValues);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success("Batch costs saved");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const costField = (
    name: "materialCost" | "labourCost" | "electricityCost" | "mouldAllocation" | "otherCosts",
    label: string,
    icon: React.ReactNode
  ) => (
    <Field key={name} label={label} error={errors[name]?.message} htmlFor={`cost-${name}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>
          {icon}
        </span>
        <Input id={`cost-${name}`} type="number" step="any" min={0} className="pl-9" {...register(name)} />
      </div>
    </Field>
  );

  return (
    <ConfirmDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={`${initial ? "Update" : "Record"} costs for ${batchNo}`}
      description="Total is the sum of the five components (DEC-025). Rejected and extra consumption are already absorbed — enter the full batch spend."
      confirmLabel={isSubmitting ? "Saving..." : "Save Costs"}
      onConfirm={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {costField("materialCost", "Material", <Coins className="size-4" />)}
        {costField("labourCost", "Labour", <CircleDollarSign className="size-4" />)}
        {costField("electricityCost", "Electricity", <CircleDollarSign className="size-4" />)}
        {costField("mouldAllocation", "Mould allocation", <Recycle className="size-4" />)}
        {costField("otherCosts", "Other", <CircleDollarSign className="size-4" />)}
        <div className={cn("rounded-lg border bg-muted/40 p-3", "sm:col-span-2")}>
          <p className="text-xs font-medium text-muted-foreground">Total batch cost</p>
          <p className="num-tight font-heading text-xl font-semibold text-foreground">{formatCurrency(total)}</p>
        </div>
      </div>
    </ConfirmDialogShell>
  );
}

function ConfirmDialogShell({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
    >
      {children}
    </ConfirmDialog>
  );
}