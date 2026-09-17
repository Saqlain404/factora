import { z } from "zod";
import {
  idSchema,
  notesSchema,
  optionalNumber,
  optionalText,
} from "@/lib/validators";

export const poItemInputSchema = z.object({
  rawMaterialId: idSchema,
  qty: z.coerce
    .number({ message: "Quantity is required" })
    .positive("Quantity must be greater than zero")
    .max(1000000, "Quantity is too large")
    .refine(
      (value) => Number.isFinite(value) && Math.round(value * 1000) === value * 1000,
      "Maximum 3 decimal places"
    ),
  rate: optionalNumber({ min: 0, precision: 2 }),
  gstRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
});

export const purchaseOrderInputSchema = z.object({
  supplierId: idSchema,
  orderDate: z.string().max(10).optional().nullable(),
  notes: notesSchema,
  items: z.array(poItemInputSchema).min(1, "Add at least one item"),
});

export const purchaseOrderUpdateSchema = purchaseOrderInputSchema.extend({
  id: idSchema,
});

export const receiveLineInputSchema = z.object({
  rawMaterialId: idSchema,
  qty: z.coerce
    .number({ message: "Quantity is required" })
    .positive("Quantity must be greater than zero")
    .max(1000000, "Quantity is too large")
    .refine(
      (value) => Number.isFinite(value) && Math.round(value * 1000) === value * 1000,
      "Maximum 3 decimal places"
    ),
  rate: optionalNumber({ min: 0, precision: 2 }),
  gstRate: optionalNumber({ min: 0, max: 100, precision: 2 }),
});

export const purchaseReceiptInputSchema = z.object({
  poId: idSchema,
  lines: z.array(receiveLineInputSchema).min(1, "Add at least one received line"),
  billNo: optionalText(60),
  billDate: z.string().max(10).optional().nullable(),
  receivedAt: z.string().max(10).optional().nullable(),
  note: notesSchema,
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderInputSchema>;
export type PurchaseOrderUpdate = z.infer<typeof purchaseOrderUpdateSchema>;
export type PurchaseReceiptInput = z.infer<typeof purchaseReceiptInputSchema>;