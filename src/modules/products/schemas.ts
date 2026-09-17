import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalNumber,
  optionalText,
  optionalUuid,
} from "@/lib/validators";

export const productInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  unit: z.string().trim().min(1, "Unit is required").max(12, "Unit is too long"),
  mouldId: optionalUuid,
  hsnCode: optionalText(16),
  gstRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
  sellingPrice: optionalNumber({ min: 0, precision: 2 }),
  notes: notesSchema,
});

export const productUpdateSchema = productInputSchema.extend({
  id: z.string().uuid("Invalid product id"),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;