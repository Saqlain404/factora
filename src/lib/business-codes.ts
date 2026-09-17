import { randomUUID } from "crypto";

export const MASTER_CODE_PREFIXES = {
  CUSTOMER: "CUST",
  SUPPLIER: "SUPP",
  RAW_MATERIAL: "RM",
  PRODUCT: "PRD",
  MOULD: "MOULD",
  MACHINE: "MCH",
  BATCH: "BATCH",
} as const;

export function generateCode(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}