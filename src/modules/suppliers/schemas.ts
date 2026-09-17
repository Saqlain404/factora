import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalEmail,
  optionalGstin,
  optionalText,
} from "@/lib/validators";

export const supplierInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  contactPhone: optionalText(24),
  email: optionalEmail,
  gstin: optionalGstin,
  address: optionalText(300),
  notes: notesSchema,
});

export const supplierUpdateSchema = supplierInputSchema.extend({
  id: z.string().uuid("Invalid supplier id"),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type SupplierUpdate = z.infer<typeof supplierUpdateSchema>;