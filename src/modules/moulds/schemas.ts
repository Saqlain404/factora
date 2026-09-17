import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalNumber,
  optionalUuid,
} from "@/lib/validators";

export const mouldInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  supplierId: optionalUuid,
  cost: optionalNumber({ min: 0, precision: 2 }),
  notes: notesSchema,
});

export const mouldUpdateSchema = mouldInputSchema.extend({
  id: z.string().uuid("Invalid mould id"),
});

export type MouldInput = z.infer<typeof mouldInputSchema>;
export type MouldUpdate = z.infer<typeof mouldUpdateSchema>;