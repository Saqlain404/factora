import { describe, expect, it } from "vitest";
import { bomItemInputSchema } from "../schemas";

const validId = "550e8400-e29b-41d4-a716-446655440000";

describe("bomItemInputSchema", () => {
  it("accepts a valid BOM row", () => {
    const result = bomItemInputSchema.safeParse({
      productId: validId,
      rawMaterialId: validId,
      qtyPerUnit: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative quantity", () => {
    expect(
      bomItemInputSchema.safeParse({
        productId: validId,
        rawMaterialId: validId,
        qtyPerUnit: 0,
      }).success
    ).toBe(false);
    expect(
      bomItemInputSchema.safeParse({
        productId: validId,
        rawMaterialId: validId,
        qtyPerUnit: -1,
      }).success
    ).toBe(false);
  });

  it("rejects a missing quantity", () => {
    const result = bomItemInputSchema.safeParse({
      productId: validId,
      rawMaterialId: validId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid ids", () => {
    const result = bomItemInputSchema.safeParse({
      productId: "bad",
      rawMaterialId: validId,
      qtyPerUnit: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than four decimal places", () => {
    const result = bomItemInputSchema.safeParse({
      productId: validId,
      rawMaterialId: validId,
      qtyPerUnit: 1.12345,
    });
    expect(result.success).toBe(false);
  });
});