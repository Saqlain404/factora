"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, LogOut, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/navigation/command-palette";

const SECTION_LABELS: Record<string, string> = {
  customers: "Customers",
  products: "Products",
  bom: "Bill of Materials",
  moulds: "Moulds",
  machines: "Machines",
  inventory: "Inventory",
  "raw-materials": "Raw Materials",
  suppliers: "Suppliers",
  procurement: "Procurement",
  "purchase-orders": "Purchase Orders",
  receipts: "Receipts",
  dashboard: "Dashboard",
};

export function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const out: string[] = [];
    for (const segment of segments) {
      const label = SECTION_LABELS[segment];
      if (!label) continue;
      const isTerminal = segment === segments[segments.length - 1];
      out.push(isTerminal && label === "Dashboard" ? "Dashboard" : label);
    }
    return out.length > 0 ? out : ["Dashboard"];
  }, [pathname]);

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const roleLabel = session?.user?.role
    ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
    : "";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger />
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
            <span className="text-muted-foreground">Factora</span>
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/60" />
                <span
                  className={
                    index === crumbs.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-2 text-muted-foreground hover:text-foreground sm:inline-flex"
            onClick={() => document.dispatchEvent(new Event("factora:open-palette"))}
            aria-label="Open command palette"
          >
            <Search aria-hidden className="size-4" />
            <span className="text-xs">Search</span>
            <kbd className="ml-1 rounded border bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => document.dispatchEvent(new Event("factora:open-palette"))}
            aria-label="Open command palette"
          >
            <Search aria-hidden className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Account menu" />}
            >
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="truncate text-sm font-medium">{session?.user?.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session?.user?.email || ""}
                  </p>
                  {roleLabel ? (
                    <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">
                      <ShieldCheck aria-hidden className="size-3" />
                      {roleLabel}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <PaletteController />
    </>
  );
}

function PaletteController() {
  return <CommandPalette triggerEvent="factora:open-palette" />;
}