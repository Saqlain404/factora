import { CheckCircle2, CircleDashed, Clock3, Loader2, Truck, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatusTone } from "./status-badge";

type StatusMeta = {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon;
};

/* ------------------------------------------------------------------ */
/* Purchase orders                                                     */
/* ------------------------------------------------------------------ */

export const PO_STATUS: Record<string, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral", icon: CircleDashed },
  confirmed: { label: "Confirmed", tone: "info", icon: Clock3 },
  received: { label: "Partially received", tone: "warning", icon: Truck },
  closed: { label: "Closed", tone: "success", icon: CheckCircle2 },
};

/* ------------------------------------------------------------------ */
/* Mould lifecycle (DEC-015)                                           */
/* ------------------------------------------------------------------ */

export const MOULD_STATUS: Record<string, StatusMeta> = {
  required: { label: "Required", tone: "neutral", icon: CircleDashed },
  ordered: { label: "Ordered", tone: "info", icon: Truck },
  received: { label: "Received", tone: "info", icon: Clock3 },
  trial: { label: "Trial", tone: "warning", icon: Clock3 },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
};

/* ------------------------------------------------------------------ */
/* Inventory levels                                                    */
/* ------------------------------------------------------------------ */

export const STOCK_LEVEL: Record<
  "in_stock" | "low" | "empty",
  StatusMeta
> = {
  in_stock: { label: "In stock", tone: "success", icon: CheckCircle2 },
  low: { label: "Low stock", tone: "warning", icon: Clock3 },
  empty: { label: "Out of stock", tone: "danger", icon: XCircle },
};

/* ------------------------------------------------------------------ */
/* Inventory ledger movement types (DEC-020)                           */
/* ------------------------------------------------------------------ */

export const LEDGER_TYPES: Record<string, StatusMeta> = {
  PURCHASE_RECEIPT: { label: "Purchase receipt", tone: "success" },
  PRODUCTION_CONSUMPTION: { label: "Consumption", tone: "warning" },
  PRODUCTION_OUTPUT: { label: "Production output", tone: "info" },
  PRODUCTION_RETURN: { label: "Production return", tone: "success" },
  DISPATCH: { label: "Dispatch", tone: "neutral" },
  ADJUSTMENT: { label: "Adjustment", tone: "neutral" },
};

/* ------------------------------------------------------------------ */
/* Production batch lifecycle (DEC-023)                                */
/* ------------------------------------------------------------------ */

export const BATCH_STATUS: Record<string, StatusMeta> = {
  in_progress: { label: "In progress", tone: "info", icon: Clock3 },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle },
};

export const BATCH_STARTED: Record<string, StatusMeta> = {
  not_started: { label: "Reserving", tone: "neutral", icon: CircleDashed },
  started: { label: "Running", tone: "info", icon: Loader2 },
};