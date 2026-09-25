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
import { getSalesOrders, getSalesOrderCounts } from "@/modules/sales/queries";
import { getDispatches, getDispatchCounts } from "@/modules/sales/dispatch-queries";
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
    salesOrders,
    salesCounts,
    dispatches,
    dispatchCounts,
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
    getSalesOrders(),
    getSalesOrderCounts(),
    getDispatches(),
    getDispatchCounts(),
  ]);

  const draftOrders = orders.filter((order) => order.status === "draft");
  const activeOrders = orders.filter(
    (order) => order.status === "confirmed" || order.status === "received"
  );

  const draftSalesOrders = salesOrders.filter((order) => order.status === "draft");
  const activeSalesOrders = salesOrders.filter(
    (order) => order.status === "confirmed" || order.status === "partial"
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
      salesCounts={salesCounts}
      dispatchCounts={dispatchCounts}
      stock={stock}
      draftOrders={draftOrders}
      activeOrders={activeOrders}
      outstandingOrders={outstanding}
      recentReceipts={receipts.slice(0, 8)}
      draftSalesOrders={draftSalesOrders}
      activeSalesOrders={activeSalesOrders}
      recentDispatches={dispatches.slice(0, 8)}
    />
  );
}