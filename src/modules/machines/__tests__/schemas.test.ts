import { describe, expect, it } from "vitest";
import { machineInputSchema } from "../schemas";

const valid = { name: "Injection Machine 80T" };

describe("machineInputSchema", () => {
  it("accepts a valid machine", () => {
    expect(machineInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(machineInputSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a negative capacity", () => {
    const result = machineInputSchema.safeParse({ ...valid, capacity: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts a positive capacity", () => {
    const result = machineInputSchema.safeParse({ ...valid, capacity: 80 });
    expect(result.success).toBe(true);
  });
});