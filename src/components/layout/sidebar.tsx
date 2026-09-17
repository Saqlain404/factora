"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Factory,
  FileText,
  LayoutDashboard,
  ListTree,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "cn";

const NAV_GROUPS = [
  {
    group: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Customers",
    items: [{ title: "Customers", url: "/customers", icon: Users }],
  },
  {
    group: "Manufacturing",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Bill of Materials", url: "/bom", icon: ListTree },
      { title: "Moulds", url: "/moulds", icon: Factory },
      { title: "Machines", url: "/machines", icon: Settings },
    ],
  },
  {
    group: "Inventory",
    items: [{ title: "Raw Materials", url: "/inventory/raw-materials", icon: Boxes }],
  },
  {
    group: "Purchasing",
    items: [
      { title: "Suppliers", url: "/suppliers", icon: ShoppingCart },
      { title: "Purchase Orders", url: "/procurement/purchase-orders", icon: FileText },
      { title: "Receipts", url: "/procurement/receipts", icon: Warehouse },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground shadow-sm">
            F
          </span>
          <span className="truncate font-heading text-[15px] font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:opacity-0">
            Factora
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.url === "/dashboard"
                      ? pathname === item.url
                      : pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className={cn("flex items-center gap-2 px-4 py-3")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
            v1
          </span>
          <p className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Factora · Manufacturing Ops
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}