export type LedgerMovementResult =
  | { ok: true; balanceAfter: number }
  | { ok: false; error: string };

export function roundToThree(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function applyLedgerMovement(
  currentBalance: number,
  qty: number
): LedgerMovementResult {
  if (!Number.isFinite(qty) || qty === 0) {
    return { ok: false, error: "Movement quantity must be a non-zero number" };
  }
  const before = Number.isFinite(currentBalance) ? currentBalance : 0;
  const balanceAfter = roundToThree(before + qty);
  if (balanceAfter < 0) {
    return {
      ok: false,
      error: "Insufficient stock - balance cannot go below zero (R11)",
    };
  }
  return { ok: true, balanceAfter };
}