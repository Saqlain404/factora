import { describe, expect, it } from "vitest";
import { purchaseOrderInputSchema, purchaseReceiptInputSchema } from "../schemas";

const validId = "550e8400-e29b-41d4-a716-446655440000";
const line = { rawMaterialId: validId, qty: 500, rate: 95, gstRate: 18 };

describe("purchaseOrderInputSchema", () => {
  it("accepts a valid order with a single item", () => {
    const result = purchaseOrderInputSchema.safeParse({
      supplierId: validId,
      orderDate: "2026-09-11",
      notes: "Monthly resin order",
      items: [line],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an order with no items", () => {
    const result = purchaseOrderInputSchema.safeParse({
      supplierId: validId,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative item quantity", () => {
    const result = purchaseOrderInputSchema.safeParse({
      supplierId: validId,
      items: [{ ...line, qty: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative rate", () => {
    const result = purchaseOrderInputSchema.safeParse({
      supplierId: validId,
      items: [{ ...line, rate: -5 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("purchaseReceiptInputSchema", () => {
  it("accepts a valid receipt with bill fields", () => {
    const result = purchaseReceiptInputSchema.safeParse({
      poId: validId,
      lines: [line],
      billNo: "SUP-123",
      billDate: "2026-09-11",
      receivedAt: "2026-09-11",
      note: "All good",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a receipt without bill fields", () => {
    const result = purchaseReceiptInputSchema.safeParse({
      poId: validId,
      lines: [line],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a receipt with no lines", () => {
    const result = purchaseReceiptInputSchema.safeParse({
      poId: validId,
      lines: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative receipt rate", () => {
    const result = purchaseReceiptInputSchema.safeParse({
      poId: validId,
      lines: [{ ...line, rate: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a receipt referencing an invalid PO id", () => {
    const result = purchaseReceiptInputSchema.safeParse({
      poId: "nope",
      lines: [line],
    });
    expect(result.success).toBe(false);
  });
});