import { z } from "zod";
import { idSchema, notesSchema, optionalUuid } from "@/lib/validators";

const quantity = (opts: { positive?: boolean } = {}) => {
  const base = z.coerce
    .number({ message: "Quantity is required" })
    .max(1000000, "Quantity is too large");
  const numbered = opts.positive
    ? base.positive("Quantity must be greater than zero")
    : base.min(0, "Quantity cannot be negative");
  return numbered.refine(
    (value) => Number.isFinite(value) && Math.round(value * 1000) === value * 1000,
    "Maximum 3 decimal places"
  );
};

const cost = z.coerce
  .number({ message: "Enter a valid number" })
  .min(0, "Costs cannot be negative")
  .max(1000000000, "Value is too large")
  .refine(
    (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
    "Maximum 2 decimal places"
  );

export const batchMaterialInputSchema = z.object({
  rawMaterialId: idSchema,
  plannedQty: quantity({ positive: true }),
});

export const createBatchInputSchema = z.object({
  productId: idSchema,
  machineId: idSchema,
  mouldId: idSchema,
  orderId: optionalUuid,
  planQty: quantity({ positive: true }),
  notes: notesSchema,
  materials: z.array(batchMaterialInputSchema),
});

export const startBatchInputSchema = z.object({
  batchId: idSchema,
});

export const batchConsumptionInputSchema = z.object({
  rawMaterialId: idSchema,
  consumedQty: quantity(),
});

export const completeBatchInputSchema = z.object({
  batchId: idSchema,
  okQty: quantity(),
  rejectedQty: quantity(),
  consumption: z.array(batchConsumptionInputSchema),
});

export const cancelBatchInputSchema = z.object({
  batchId: idSchema,
});

export const batchCostsInputSchema = z.object({
  batchId: idSchema,
  materialCost: cost,
  labourCost: cost,
  electricityCost: cost,
  mouldAllocation: cost,
  otherCosts: cost,
});

export type CreateBatchInput = z.infer<typeof createBatchInputSchema>;
export type StartBatchInput = z.infer<typeof startBatchInputSchema>;
export type CompleteBatchInput = z.infer<typeof completeBatchInputSchema>;
export type CancelBatchInput = z.infer<typeof cancelBatchInputSchema>;
export type BatchCostsInput = z.infer<typeof batchCostsInputSchema>;
export type BatchMaterialInput = z.infer<typeof batchMaterialInputSchema>;