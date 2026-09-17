import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type MetricTone = "default" | "info" | "success" | "warning" | "danger";

const ICON_TONES: Record<MetricTone, string> = {
  default: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              ICON_TONES[tone]
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-1 min-w-0">
        <div className="num-tight truncate font-heading text-[1.7rem] leading-tight font-semibold tracking-tight text-foreground">
          {value}
        </div>
        {sub ? <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </>
  );

  const base = cn(
    "group rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-ring/40",
    href && "hover:bg-accent/40"
  );

  if (href) {
    return (
      <a href={href} className={cn(base, "block")}>
        {content}
      </a>
    );
  }
  return <div className={base}>{content}</div>;
}