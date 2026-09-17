import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalEmail,
  optionalGstin,
  optionalText,
  preprocessOptionalString,
} from "@/lib/validators";

export const customerInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  contactPhone: optionalText(24),
  email: optionalEmail,
  gstin: optionalGstin,
  state: optionalText(60),
  stateCode: preprocessOptionalString(8),
  address: optionalText(300),
  creditPeriodDays: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(0, "Credit period cannot be negative").max(3650).default(30)
  ),
  notes: notesSchema,
});

export const customerUpdateSchema = customerInputSchema.extend({
  id: z.string().uuid("Invalid customer id"),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;