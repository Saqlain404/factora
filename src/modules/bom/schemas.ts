import { z } from "zod";
import { idSchema } from "@/lib/validators";

export const bomItemInputSchema = z.object({
  productId: idSchema,
  rawMaterialId: idSchema,
  qtyPerUnit: z.coerce
    .number({ message: "Quantity is required" })
    .positive("Quantity must be greater than zero")
    .max(1000000, "Quantity is too large")
    .refine(
      (value) => Number.isFinite(value) && Math.round(value * 10000) === value * 10000,
      "Maximum 4 decimal places"
    ),
});

export const bomItemUpdateSchema = bomItemInputSchema.extend({
  id: idSchema,
});

export type BomItemInput = z.infer<typeof bomItemInputSchema>;
export type BomItemUpdate = z.infer<typeof bomItemUpdateSchema>;