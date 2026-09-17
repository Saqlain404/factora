import { describe, expect, it } from "vitest";
import { applyLedgerMovement, roundToThree } from "../domain";

describe("roundToThree", () => {
  it("rounds to three decimal places", () => {
    expect(roundToThree(0.123456)).toBe(0.123);
    expect(roundToThree(10.0005)).toBe(10.001);
  });
});

describe("applyLedgerMovement (R11)", () => {
  it("increases balance on a positive movement", () => {
    expect(applyLedgerMovement(0, 10)).toEqual({ ok: true, balanceAfter: 10 });
  });

  it("decreases balance on a negative movement", () => {
    expect(applyLedgerMovement(100, -30)).toEqual({ ok: true, balanceAfter: 70 });
  });

  it("allows a movement that lands exactly on zero", () => {
    expect(applyLedgerMovement(5, -5)).toEqual({ ok: true, balanceAfter: 0 });
  });

  it("rejects a zero quantity", () => {
    const result = applyLedgerMovement(10, 0);
    expect(result.ok).toBe(false);
  });

  it("rejects a movement that would take balance below zero", () => {
    const result = applyLedgerMovement(5, -6);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("R11");
  });

  it("rejects a non-finite quantity", () => {
    expect(applyLedgerMovement(10, Number.NaN).ok).toBe(false);
    expect(applyLedgerMovement(10, Infinity).ok).toBe(false);
  });

  it("treats a missing current balance as zero", () => {
    expect(applyLedgerMovement(undefined as unknown as number, 4)).toEqual({
      ok: true,
      balanceAfter: 4,
    });
  });

  it("rounds the computed balance to three decimals", () => {
    expect(applyLedgerMovement(0.123, 0.8006)).toEqual({
      ok: true,
      balanceAfter: roundToThree(0.9236),
    });
  });
});