import { describe, expect, it } from "vitest";
import {
  createBatchInputSchema,
  completeBatchInputSchema,
  batchCostsInputSchema,
} from "../schemas";

const id = "550e8400-e29b-41d4-a716-446655440000";

describe("createBatchInputSchema", () => {
  const base = {
    productId: id,
    machineId: id,
    mouldId: id,
    planQty: 100,
    materials: [{ rawMaterialId: id, plannedQty: 12.5 }],
  };

  it("accepts a valid batch with one material line", () => {
    expect(createBatchInputSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a for-stock batch with no order", () => {
    expect(
      createBatchInputSchema.safeParse({ ...base, orderId: undefined }).success
    ).toBe(true);
  });

  it("accepts an optional valid order id", () => {
    expect(
      createBatchInputSchema.safeParse({ ...base, orderId: id }).success
    ).toBe(true);
  });

  it("rejects a zero or negative plan qty", () => {
    expect(createBatchInputSchema.safeParse({ ...base, planQty: 0 }).success).toBe(false);
    expect(createBatchInputSchema.safeParse({ ...base, planQty: -5 }).success).toBe(false);
  });

  it("rejects a plan qty with more than 3 decimals", () => {
    expect(createBatchInputSchema.safeParse({ ...base, planQty: 1.0001 }).success).toBe(false);
  });

  it("rejects empty materials", () => {
    expect(
      createBatchInputSchema.safeParse({ ...base, materials: [] }).success
    ).toBe(false);
  });

  it("rejects a zero planned qty on a material line", () => {
    expect(
      createBatchInputSchema.safeParse({
        ...base,
        materials: [{ rawMaterialId: id, plannedQty: 0 }],
      }).success
    ).toBe(false);
  });
});

describe("completeBatchInputSchema", () => {
  const base = {
    batchId: id,
    okQty: 90,
    rejectedQty: 5,
    consumption: [{ rawMaterialId: id, consumedQty: 11 }],
  };

  it("accepts ok + rejected + consumption", () => {
    expect(completeBatchInputSchema.safeParse(base).success).toBe(true);
  });

  it("accepts zero rejected and zero consumption (fully returned)", () => {
    expect(
      completeBatchInputSchema.safeParse({
        ...base,
        rejectedQty: 0,
        consumption: [{ rawMaterialId: id, consumedQty: 0 }],
      }).success
    ).toBe(true);
  });

  it("rejects negative ok or rejected qty", () => {
    expect(completeBatchInputSchema.safeParse({ ...base, okQty: -1 }).success).toBe(false);
    expect(completeBatchInputSchema.safeParse({ ...base, rejectedQty: -1 }).success).toBe(false);
  });

  it("accepts empty consumption (batch with no reserved materials)", () => {
    expect(
      completeBatchInputSchema.safeParse({ ...base, consumption: [] }).success
    ).toBe(true);
  });

  it("rejects a consumption line without a material id", () => {
    expect(
      completeBatchInputSchema.safeParse({
        ...base,
        consumption: [{ rawMaterialId: "not-a-uuid", consumedQty: 1 }],
      }).success
    ).toBe(false);
  });
});

describe("batchCostsInputSchema (DEC-025)", () => {
  const base = { batchId: id };

  it("accepts a full breakdown", () => {
    expect(
      batchCostsInputSchema.safeParse({
        ...base,
        materialCost: 100,
        labourCost: 50,
        electricityCost: 10,
        mouldAllocation: 5,
        otherCosts: 2.5,
      }).success
    ).toBe(true);
  });

  it("accepts zeros (defaults)", () => {
    expect(
      batchCostsInputSchema.safeParse({
        ...base,
        materialCost: 0,
        labourCost: 0,
        electricityCost: 0,
        mouldAllocation: 0,
        otherCosts: 0,
      }).success
    ).toBe(true);
  });

  it("rejects negative costs", () => {
    expect(
      batchCostsInputSchema.safeParse({
        ...base,
        materialCost: -1,
        labourCost: 0,
        electricityCost: 0,
        mouldAllocation: 0,
        otherCosts: 0,
      }).success
    ).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    expect(
      batchCostsInputSchema.safeParse({
        ...base,
        materialCost: 1.001,
        labourCost: 0,
        electricityCost: 0,
        mouldAllocation: 0,
        otherCosts: 0,
      }).success
    ).toBe(false);
  });
});