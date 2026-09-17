import { describe, expect, it } from "vitest";
import { supplierInputSchema } from "../schemas";

const valid = {
  name: "Resin Distributors",
  gstin: "09ABCDE1234F1Z5",
  email: "sales@resin.example.com",
};

describe("supplierInputSchema", () => {
  it("accepts a valid supplier", () => {
    expect(supplierInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = supplierInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a malformed GSTIN", () => {
    const result = supplierInputSchema.safeParse({ ...valid, gstin: "xx" });
    expect(result.success).toBe(false);
  });

  it("accepts empty optional fields as undefined", () => {
    const result = supplierInputSchema.safeParse({
      name: valid.name,
      gstin: "",
      email: "",
      address: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gstin).toBeUndefined();
      expect(result.data.email).toBeUndefined();
      expect(result.data.address).toBeUndefined();
    }
  });
});