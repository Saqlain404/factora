import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon;
};

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-current opacity-60",
  info: "bg-current",
  success: "bg-current",
  warning: "bg-current",
  danger: "bg-current",
};

export function StatusBadge({
  tone = "neutral",
  label,
  icon: IconProp,
  showDot = true,
  status,
  map,
  className,
}: {
  tone?: StatusTone;
  label?: string;
  icon?: LucideIcon;
  showDot?: boolean;
  status?: string;
  map?: Record<string, StatusMeta>;
  className?: string;
}) {
  const meta = status != null && map ? map[status] : undefined;
  const resolvedTone = meta?.tone ?? tone;
  const resolvedLabel = meta?.label ?? label ?? status ?? "";
  const Icon = meta?.icon ?? IconProp;
  return (
    <span
      className={cn(
        "inline-flex h-5.5 w-fit items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      {Icon ? (
        <Icon className="size-3.5" aria-hidden />
      ) : showDot ? (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[resolvedTone])}
        />
      ) : null}
      {resolvedLabel}
    </span>
  );
}

export type { LucideIcon as StatusIcon };