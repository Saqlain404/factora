import { z } from "zod";
import {
  businessCodeSchema,
  nameSchema,
  notesSchema,
  optionalNumber,
} from "@/lib/validators";

export const machineInputSchema = z.object({
  name: nameSchema,
  code: businessCodeSchema.optional(),
  capacity: optionalNumber({ min: 0, precision: 3 }),
  notes: notesSchema,
});

export const machineUpdateSchema = machineInputSchema.extend({
  id: z.string().uuid("Invalid machine id"),
});

export type MachineInput = z.infer<typeof machineInputSchema>;
export type MachineUpdate = z.infer<typeof machineUpdateSchema>;