"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import type { LucideIcon } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  sortable?: boolean;
  hideOnMobile?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

export type DataTableFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
};

export type DataTableSearch<T> = {
  placeholder?: string;
  keys: (row: T) => string[];
};

const DEFAULT_PAGE_SIZE = 12;

export function DataTable<T>({
  data,
  columns,
  rowKey,
  search,
  filters,
  pageSize = DEFAULT_PAGE_SIZE,
  empty,
  loading = false,
  actions,
  getRowActions,
  label = "Results",
}: {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  search?: DataTableSearch<T>;
  filters?: DataTableFilter[];
  pageSize?: number;
  empty: { icon?: LucideIcon; title: string; description?: string };
  loading?: boolean;
  actions?: React.ReactNode;
  getRowActions?: (row: T) => React.ReactNode;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const sortableColumns = useMemo(
    () => columns.filter((column) => column.sortable && column.sortValue),
    [columns]
  );
  const hasToolbar = search || (filters && filters.length > 0) || actions;
  const hasActiveFilter =
    (filters ?? []).some((filter) => filter.value !== "") || query !== "";

  const filtered = useMemo(() => {
    let rows = data;
    if (search && query.trim()) {
      const needle = query.trim().toLowerCase();
      rows = rows.filter((row) =>
        search.keys(row).some((value) => value.toLowerCase().includes(needle))
      );
    }
    for (const filter of filters ?? []) {
      if (filter.value) {
        rows = rows.filter(
          (row) => String((row as Record<string, unknown>)[filter.key]) === filter.value
        );
      }
    }
    if (sortKey && sortDir) {
      const column = columns.find((c) => c.key === sortKey);
      const value = column?.sortValue;
      if (value) {
        const sorted = [...rows].sort((a, b) => {
          const av = value(a);
          const bv = value(b);
          if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
          return sortDir === "asc"
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
        rows = sorted;
      }
    }
    return rows;
  }, [data, search, query, filters, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function resetFilters() {
    setQuery("");
    filters?.forEach((filter) => filter.onValueChange(""));
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {hasToolbar ? (
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {search ? (
              <div className="relative w-full max-w-xs">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder={search.placeholder ?? "Search..."}
                  className="h-8 pl-8"
                  aria-label={search.placeholder ?? "Search"}
                />
              </div>
            ) : null}
            {(filters ?? []).map((filter) => (
              <Select
                key={filter.key}
                value={filter.value}
                onValueChange={(value) => {
                  filter.onValueChange(value ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs" aria-label={filter.label}>
                  <SlidersHorizontal aria-hidden className="size-3.5 text-muted-foreground" />
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {hasActiveFilter ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} aria-label="Clear filters">
                <X aria-hidden className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === "right" && "text-right",
                    column.hideOnMobile && "hidden md:table-cell",
                    column.sortable && "cursor-pointer select-none",
                    column.className
                  )}
                  onClick={
                    column.sortable && sortableColumns.some((c) => c.key === column.key)
                      ? () => toggleSort(column.key)
                      : undefined
                  }
                  aria-sort={
                    sortKey === column.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  scope="col"
                >
                  <span className="inline-flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortableColumns.some((c) => c.key === column.key) ? (
                      <span className="text-muted-foreground" aria-hidden>
                        {sortKey === column.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </span>
                    ) : null}
                  </span>
                </TableHead>
              ))}
              {getRowActions ? (
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={columns.length + (getRowActions ? 1 : 0)}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : pageRows.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "align-middle",
                          column.align === "right" && "text-right",
                          column.hideOnMobile && "hidden md:table-cell",
                          column.className
                        )}
                      >
                        {column.render ? column.render(row) : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                      </TableCell>
                    ))}
                    {getRowActions ? (
                      <TableCell className="text-right align-middle">
                        <div className="flex justify-end gap-1">{getRowActions(row)}</div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
          </TableBody>
          {!loading && pageRows.length > 0 ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={columns.length + (getRowActions ? 1 : 0)} className="bg-muted/30 py-2 text-xs text-muted-foreground">
                  <span className="num">
                    {filtered.length === 0
                      ? `No ${label.toLowerCase()}`
                      : `Showing ${(safePage - 1) * pageSize + 1}–${(safePage - 1) * pageSize + pageRows.length} of ${filtered.length} ${label.toLowerCase()}`}
                  </span>
                </TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>

      {!loading && pageRows.length === 0 ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={
            empty.description ??
            (hasActiveFilter
              ? "No results match your search or filters."
              : `Nothing here yet.`)
          }
          action={
            hasActiveFilter ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear search & filters
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {totalPages > 1 && !loading ? (
        <div className="flex items-center justify-end gap-3 border-t px-3 py-2">
          <span className="num text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}