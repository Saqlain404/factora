import { describe, expect, it } from "vitest";
import { mouldInputSchema } from "../schemas";

const valid = { name: "Cap Mould - 28mm" };

describe("mouldInputSchema", () => {
  it("accepts a valid mould", () => {
    expect(mouldInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = mouldInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a negative cost", () => {
    const result = mouldInputSchema.safeParse({ ...valid, cost: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid supplier id", () => {
    const result = mouldInputSchema.safeParse({ ...valid, supplierId: "nope" });
    expect(result.success).toBe(false);
  });
});