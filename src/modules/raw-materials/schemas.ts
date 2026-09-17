import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalNumber,
  optionalText,
} from "@/lib/validators";

export const rawMaterialInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(12, "Unit is too long"),
  hsnCode: optionalText(16),
  currentRate: optionalNumber({ min: 0, precision: 2 }),
  gstRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
  minStockQty: optionalNumber({ min: 0, precision: 3 }),
  notes: notesSchema,
});

export const rawMaterialUpdateSchema = rawMaterialInputSchema.extend({
  id: z.string().uuid("Invalid raw material id"),
});

export type RawMaterialInput = z.infer<typeof rawMaterialInputSchema>;
export type RawMaterialUpdate = z.infer<typeof rawMaterialUpdateSchema>;