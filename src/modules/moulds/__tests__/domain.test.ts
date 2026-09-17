import { describe, expect, it } from "vitest";
import { MOULD_STATUSES, nextMouldStatus } from "../domain";
import type { MouldStatus } from "../schema";

describe("mould lifecycle (DEC-015)", () => {
  it("is a strict chain required -> ordered -> received -> trial -> active", () => {
    expect(MOULD_STATUSES).toEqual([
      "required",
      "ordered",
      "received",
      "trial",
      "active",
    ]);
  });

  const validTransitions: Array<[MouldStatus, MouldStatus]> = [
    ["required", "ordered"],
    ["ordered", "received"],
    ["received", "trial"],
    ["trial", "active"],
  ];

  it.each(validTransitions)("advances %s -> %s", (from, to) => {
    const result = nextMouldStatus(from);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.next).toBe(to);
    }
  });

  it("rejects advancing an already active mould", () => {
    const result = nextMouldStatus("active");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/already active/i);
    }
  });

  it("rejects skipping a stage (required -> received)", () => {
    const result = nextMouldStatus("required");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.next).toBe("ordered");
      expect(result.next).not.toBe("received");
    }
  });

  it.each(["ordered", "received", "trial", "active"] as MouldStatus[])(
    "cannot go backwards from %s",
    (current) => {
      const index = MOULD_STATUSES.indexOf(current);
      expect(index).toBeGreaterThan(0);
    }
  );

  it("rejects an unknown status", () => {
    const result = nextMouldStatus("unknown" as MouldStatus);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unknown/i);
    }
  });
});