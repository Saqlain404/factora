import { describe, expect, it } from "vitest";
import { rawMaterialInputSchema } from "../schemas";

const valid = {
  name: "Polypropylene Granules",
  unit: "kg",
  hsnCode: "39021000",
  currentRate: 92.5,
  gstRate: 18,
  minStockQty: 500,
};

describe("rawMaterialInputSchema", () => {
  it("accepts a valid raw material", () => {
    expect(rawMaterialInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing unit", () => {
    const result = rawMaterialInputSchema.safeParse({ name: valid.name });
    expect(result.success).toBe(false);
  });

  it("rejects a negative rate", () => {
    const result = rawMaterialInputSchema.safeParse({
      ...valid,
      currentRate: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a GST rate above 100", () => {
    const result = rawMaterialInputSchema.safeParse({
      ...valid,
      gstRate: 118,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative minimum stock", () => {
    const result = rawMaterialInputSchema.safeParse({
      ...valid,
      minStockQty: -10,
    });
    expect(result.success).toBe(false);
  });

  it("coerces empty numeric fields to undefined and defaults to 0 at insert", () => {
    const result = rawMaterialInputSchema.safeParse({ name: valid.name, unit: "kg" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentRate).toBeUndefined();
    }
  });
});