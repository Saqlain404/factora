import { describe, expect, it } from "vitest";
import { productInputSchema } from "../schemas";

const valid = {
  name: "Bottle Cap 28mm",
  unit: "pcs",
  hsnCode: "39235090",
  gstRate: 18,
  sellingPrice: 0.85,
};

describe("productInputSchema", () => {
  it("accepts a valid product", () => {
    expect(productInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing unit", () => {
    expect(productInputSchema.safeParse({ name: valid.name }).success).toBe(false);
  });

  it("rejects a negative selling price", () => {
    const result = productInputSchema.safeParse({
      ...valid,
      sellingPrice: -0.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid mould id", () => {
    const result = productInputSchema.safeParse({
      ...valid,
      mouldId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid mould id", () => {
    const result = productInputSchema.safeParse({
      ...valid,
      mouldId: "a8098c1a-f86e-11da-bd1a-00112444be1e",
    });
    expect(result.success).toBe(true);
  });
});