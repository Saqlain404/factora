import { describe, expect, it } from "vitest";
import { customerInputSchema, customerUpdateSchema } from "../schemas";

const valid = {
  name: "Amit Plastics",
  contactPhone: "9876543210",
  email: "amit@example.com",
  gstin: "09ABCDE1234F1Z5",
  state: "Uttar Pradesh",
  stateCode: "09",
  creditPeriodDays: 30,
};

describe("customerInputSchema", () => {
  it("accepts a valid customer", () => {
    const result = customerInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("generates a default credit period of 30 days", () => {
    const result = customerInputSchema.safeParse({ name: valid.name });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creditPeriodDays).toBe(30);
    }
  });

  it("rejects a missing name", () => {
    const result = customerInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a negative credit period", () => {
    const result = customerInputSchema.safeParse({
      ...valid,
      creditPeriodDays: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = customerInputSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed GSTIN", () => {
    const result = customerInputSchema.safeParse({
      ...valid,
      gstin: "invalid-gstin",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a missing optional GSTIN", () => {
    const result = customerInputSchema.safeParse({ name: valid.name });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gstin).toBeUndefined();
    }
  });

  it("rejects a bad code format", () => {
    const result = customerInputSchema.safeParse({
      ...valid,
      code: "lower case!",
    });
    expect(result.success).toBe(false);
  });
});

describe("customerUpdateSchema", () => {
  it("requires a valid uuid id", () => {
    const result = customerUpdateSchema.safeParse({ ...valid, id: "nope" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid update", () => {
    const result = customerUpdateSchema.safeParse({
      ...valid,
      id: "a8098c1a-f86e-11da-bd1a-00112444be1e",
    });
    expect(result.success).toBe(true);
  });
});