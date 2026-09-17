"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "cn";

type Command = {
  label: string;
  hint?: string;
  section: string;
  keywords: string;
  icon?: React.ReactNode;
  run: () => void;
};

const NAV_COMMANDS: Command[] = [
  { section: "Go to", label: "Dashboard", keywords: "dashboard home overview", run: () => void 0 },
  { section: "Go to", label: "Customers", keywords: "customers clients parties", run: () => void 0 },
  { section: "Go to", label: "Products", keywords: "products finished goods items", run: () => void 0 },
  { section: "Go to", label: "Bill of Materials", keywords: "bom materials recipe", run: () => void 0 },
  { section: "Go to", label: "Moulds", keywords: "moulds tools dies", run: () => void 0 },
  { section: "Go to", label: "Machines", keywords: "machines equipment", run: () => void 0 },
  { section: "Go to", label: "Raw Materials", keywords: "raw materials inventory stock granules", run: () => void 0 },
  { section: "Go to", label: "Suppliers", keywords: "suppliers vendors purchasing", run: () => void 0 },
  { section: "Go to", label: "Purchase Orders", keywords: "purchase orders po buying", run: () => void 0 },
  { section: "Go to", label: "Receipts", keywords: "purchase receipts stock in goods receive", run: () => void 0 },
];

const ACTION_COMMANDS: Command[] = [
  { section: "Create", label: "New Purchase Order", keywords: "create purchase order po new", run: () => void 0 },
  { section: "Create", label: "Record Purchase Receipt", keywords: "record receipt stock in new purchase", run: () => void 0 },
];

export function CommandPalette({ triggerEvent }: { triggerEvent?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => buildCommands(router), [router]);

  useEffect(() => {
    if (!triggerEvent) return;
    function onTrigger() {
      setQuery("");
      setActiveIndex(0);
      setOpen(true);
    }
    window.addEventListener(triggerEvent, onTrigger);
    return () => window.removeEventListener(triggerEvent, onTrigger);
  }, [triggerEvent]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          setQuery("");
          setActiveIndex(0);
          setOpen(true);
        }
        return;
      }
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? commands.filter(
          (command) =>
            command.label.toLowerCase().includes(needle) ||
            command.keywords.includes(needle)
        )
      : commands;
    return list;
  }, [commands, query]);

  function runCommand(command: Command) {
    setOpen(false);
    command.run();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = results[activeIndex];
      if (command) runCommand(command);
    }
  }

  if (!open) return null;

  const grouped = results.reduce<Record<string, Command[]>>((acc, command) => {
    (acc[command.section] ??= []).push(command);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px]" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search Factora…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search commands"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results for “{query}”
            </p>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section} className="mb-1">
                <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {section}
                </p>
                {items.map((command) => {
                  const flatIndex = results.indexOf(command);
                  return (
                    <button
                      key={command.label}
                      type="button"
                      onClick={() => runCommand(command)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                        activeIndex === flatIndex ? "bg-accent text-accent-foreground" : "text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        {command.icon}
                        <span className="truncate">{command.label}</span>
                      </span>
                      {activeIndex === flatIndex ? (
                        <CornerDownLeft aria-hidden className="size-3.5 text-muted-foreground" />
                      ) : (
                        command.hint && (
                          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                            {command.hint}
                          </kbd>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function buildCommands(router: ReturnType<typeof useRouter>): Command[] {
  const nav = NAV_COMMANDS.map((command) => {
    const slug = command.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const url =
      slug === "dashboard"
        ? "/dashboard"
        : slug === "purchase-orders"
          ? "/procurement/purchase-orders"
          : slug === "receipts"
            ? "/procurement/receipts"
            : slug === "raw-materials"
              ? "/inventory/raw-materials"
              : slug === "bill-of-materials"
                ? "/bom"
                : `/${slug}`;
    return { ...command, run: () => router.push(url) };
  });
  const actions = ACTION_COMMANDS.map((command) => ({
    ...command,
    run: () =>
      router.push(
        command.label.startsWith("New Purchase Order")
          ? "/procurement/purchase-orders/new"
          : "/procurement/receipts/new"
      ),
  }));
  return [...nav, ...actions];
}