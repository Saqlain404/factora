import { z } from "zod";

export const salesOrderItemInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.coerce.number().positive("Quantity must be positive"),
  rate: z.number().min(0, "Rate cannot be negative").optional().nullable(),
  gstRate: z.number().min(0, "GST rate cannot be negative").default(0),
});

export const createSalesOrderInputSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().max(10).optional().nullable(),
  expectedDate: z.string().max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(salesOrderItemInputSchema).min(1, "At least one item required"),
});

export const updateSalesOrderInputSchema = createSalesOrderInputSchema.partial().extend({
  id: z.string().min(1, "Sales order ID is required"),
});

export const confirmSalesOrderInputSchema = z.object({
  id: z.string().min(1, "Sales order ID is required"),
});

export const cancelSalesOrderInputSchema = z.object({
  id: z.string().min(1, "Sales order ID is required"),
});

export type SalesOrderItemInput = z.infer<typeof salesOrderItemInputSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderInputSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderInputSchema>;
export type ConfirmSalesOrderInput = z.infer<typeof confirmSalesOrderInputSchema>;
export type CancelSalesOrderInput = z.infer<typeof cancelSalesOrderInputSchema>;