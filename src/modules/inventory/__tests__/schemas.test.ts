import { describe, expect, it } from "vitest";
import { adjustStockInputSchema } from "../schemas";

const validId = "550e8400-e29b-41d4-a716-446655440000";

describe("adjustStockInputSchema", () => {
  it("accepts a positive adjustment with a note", () => {
    const result = adjustStockInputSchema.safeParse({
      rawMaterialId: validId,
      qty: 25,
      note: "Cycle count correction",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a negative adjustment (removal) with a note", () => {
    const result = adjustStockInputSchema.safeParse({
      rawMaterialId: validId,
      qty: -5,
      note: "Damaged bag removed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero quantity", () => {
    const result = adjustStockInputSchema.safeParse({
      rawMaterialId: validId,
      qty: 0,
      note: "nothing",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing note", () => {
    const result = adjustStockInputSchema.safeParse({
      rawMaterialId: validId,
      qty: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid raw material id", () => {
    const result = adjustStockInputSchema.safeParse({
      rawMaterialId: "not-a-uuid",
      qty: 5,
      note: "oops",
    });
    expect(result.success).toBe(false);
  });
});