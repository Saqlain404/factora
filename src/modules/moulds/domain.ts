import type { MouldStatus } from "./schema";

export const MOULD_STATUSES = [
  "required",
  "ordered",
  "received",
  "trial",
  "active",
] as const satisfies readonly MouldStatus[];

export type MouldTransitionResult =
  | { ok: true; next: MouldStatus }
  | { ok: false; error: string };

export function nextMouldStatus(
  current: MouldStatus
): MouldTransitionResult {
  const index = MOULD_STATUSES.indexOf(current);
  if (index === -1) {
    return { ok: false, error: `Unknown mould status: "${current}"` };
  }
  if (index === MOULD_STATUSES.length - 1) {
    return { ok: false, error: "Mould is already active - no further transitions" };
  }
  return { ok: true, next: MOULD_STATUSES[index + 1] };
}

export function mouldIsActive(status: MouldStatus): boolean {
  return status === "active";
}