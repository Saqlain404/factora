import { z } from "zod";
import { idSchema } from "@/lib/validators";

export const adjustStockInputSchema = z.object({
  rawMaterialId: idSchema,
  qty: z.coerce
    .number({ message: "Quantity is required" })
    .refine((value) => value !== 0, "Adjustment quantity cannot be zero")
    .max(1000000, "Quantity is too large")
    .refine(
      (value) => Number.isFinite(value) && Math.round(value * 1000) === value * 1000,
      "Maximum 3 decimal places"
    ),
  note: z
    .string()
    .trim()
    .min(1, "A note is required for stock adjustments"),
});

export const inventoryItemSortSchema = z.enum(["raw_material", "product"]);

export type AdjustStockInput = z.infer<typeof adjustStockInputSchema>;