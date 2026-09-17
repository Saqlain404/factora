import { describe, expect, it } from "vitest";
import {
  batchCanStart,
  batchCanComplete,
  batchCanCancel,
  computeUnusedQty,
  consumedMatchesReserved,
  batchCostsTotal,
  roundMoney,
} from "../domain";

const reserved = [
  { rawMaterialId: "a", plannedQty: 10 },
  { rawMaterialId: "b", plannedQty: 5 },
];

describe("batch state transitions", () => {
  it("can start a batch that is in progress", () => {
    expect(batchCanStart("in_progress")).toBe(true);
  });

  it("cannot start a completed or cancelled batch", () => {
    expect(batchCanStart("completed")).toBe(false);
    expect(batchCanStart("cancelled")).toBe(false);
  });

  it("can complete only a started (reserved) in_progress batch", () => {
    expect(batchCanComplete("in_progress", new Date())).toBe(true);
    expect(batchCanComplete("in_progress", null)).toBe(false);
    expect(batchCanComplete("completed", new Date())).toBe(false);
  });

  it("can cancel only an in_progress batch", () => {
    expect(batchCanCancel("in_progress")).toBe(true);
    expect(batchCanCancel("completed")).toBe(false);
    expect(batchCanCancel("cancelled")).toBe(false);
  });
});

describe("computeUnusedQty", () => {
  it("returns planned minus consumed", () => {
    expect(computeUnusedQty(10, 7.5)).toBe(2.5);
  });

  it("clamps at zero when over-consumed", () => {
    expect(computeUnusedQty(10, 12)).toBe(0);
  });

  it("returns the full planned qty when nothing consumed", () => {
    expect(computeUnusedQty(10, 0)).toBe(10);
  });

  it("rounds to three decimals", () => {
    expect(computeUnusedQty(1.0004, 0.0001)).toBe(1);
  });
});

describe("consumedMatchesReserved (DEC-024)", () => {
  it("accepts consumption covering every reserved material", () => {
    expect(
      consumedMatchesReserved(
        [
          { rawMaterialId: "a", consumedQty: 8 },
          { rawMaterialId: "b", consumedQty: 5 },
        ],
        reserved
      )
    ).toEqual({ ok: true });
  });

  it("rejects a missing reserved material", () => {
    const result = consumedMatchesReserved(
      [{ rawMaterialId: "a", consumedQty: 8 }],
      reserved
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("missing");
  });

  it("rejects a duplicate material line", () => {
    const result = consumedMatchesReserved(
      [
        { rawMaterialId: "a", consumedQty: 4 },
        { rawMaterialId: "a", consumedQty: 4 },
      ],
      reserved
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("more than once");
  });

  it("rejects a negative consumed qty", () => {
    const result = consumedMatchesReserved(
      [
        { rawMaterialId: "a", consumedQty: -1 },
        { rawMaterialId: "b", consumedQty: 5 },
      ],
      reserved
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown material in consumption", () => {
    const result = consumedMatchesReserved(
      [
        { rawMaterialId: "a", consumedQty: 8 },
        { rawMaterialId: "c", consumedQty: 1 },
      ],
      reserved
    );
    expect(result.ok).toBe(false);
  });
});

describe("batchCostsTotal (DEC-025)", () => {
  it("sums the five cost components", () => {
    expect(
      batchCostsTotal({
        materialCost: 100.5,
        labourCost: 50.25,
        electricityCost: 12.5,
        mouldAllocation: 20,
        otherCosts: 3.75,
      })
    ).toBe(187);
  });

  it("rounds the total to two decimals", () => {
    expect(
      batchCostsTotal({
        materialCost: 0.333,
        labourCost: 0.333,
        electricityCost: 0,
        mouldAllocation: 0,
        otherCosts: 0,
      })
    ).toBe(roundMoney(0.666));
  });
});