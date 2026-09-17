import type { Metadata } from "next";
import { listCustomers } from "@/modules/customers/queries";
import { listSuppliers } from "@/modules/suppliers/queries";
import { listProducts } from "@/modules/products/queries";
import { listRawMaterials } from "@/modules/raw-materials/queries";
import { listMachines } from "@/modules/machines/queries";
import { listMoulds } from "@/modules/moulds/queries";
import { getStockBalances } from "@/modules/inventory/queries";
import {
  listPurchaseOrders,
  listConfirmedOrdersWithItems,
  listPurchaseReceipts,
} from "@/modules/procurement/queries";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [
    customers,
    suppliers,
    products,
    materials,
    machines,
    moulds,
    stock,
    orders,
    outstanding,
    receipts,
  ] = await Promise.all([
    listCustomers(),
    listSuppliers(),
    listProducts(),
    listRawMaterials(),
    listMachines(),
    listMoulds(),
    getStockBalances(),
    listPurchaseOrders(),
    listConfirmedOrdersWithItems(),
    listPurchaseReceipts(),
  ]);

  const draftOrders = orders.filter((order) => order.status === "draft");
  const activeOrders = orders.filter(
    (order) => order.status === "confirmed" || order.status === "received"
  );

  return (
    <DashboardView
      counts={{
        customers: customers.length,
        suppliers: suppliers.length,
        products: products.length,
        materials: materials.length,
        machines: machines.length,
        moulds: moulds.length,
      }}
      stock={stock}
      draftOrders={draftOrders}
      activeOrders={activeOrders}
      outstandingOrders={outstanding}
      recentReceipts={receipts.slice(0, 8)}
    />
  );
}