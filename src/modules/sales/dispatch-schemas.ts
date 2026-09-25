import { z } from "zod";

export const dispatchItemInputSchema = z.object({
  soItemId: z.string().min(1, "Sales order item is required"),
  productId: z.string().min(1, "Product is required"),
  qty: z.number().positive("Quantity must be positive"),
});

export const createDispatchInputSchema = z.object({
  soId: z.string().min(1, "Sales order is required"),
  customerId: z.string().min(1, "Customer is required"),
  dispatchDate: z.string().max(10).optional().nullable(),
  expectedDeliveryDate: z.string().max(10).optional().nullable(),
  vehicleNo: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(dispatchItemInputSchema).min(1, "At least one item required"),
});

export const updateDispatchStatusInputSchema = z.object({
  id: z.string().min(1, "Dispatch ID is required"),
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
  actualDeliveryDate: z.string().max(10).optional().nullable(),
});

export const cancelDispatchInputSchema = z.object({
  id: z.string().min(1, "Dispatch ID is required"),
});

export type DispatchItemInput = z.infer<typeof dispatchItemInputSchema>;
export type CreateDispatchInput = z.infer<typeof createDispatchInputSchema>;
export type UpdateDispatchStatusInput = z.infer<typeof updateDispatchStatusInputSchema>;
export type CancelDispatchInput = z.infer<typeof cancelDispatchInputSchema>;