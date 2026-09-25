import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  salesOrders,
  salesOrderItems,
  type SalesOrderRow,
  type SalesOrderItemRow,
} from "./schema";
import { customers } from "@/modules/customers/schema";
import { products } from "@/modules/products/schema";

export type SalesOrderWithCustomer = SalesOrderRow & {
  customerName: string;
  customerCode: string;
};

export type SalesOrderWithDetails = SalesOrderWithCustomer & {
  items: (SalesOrderItemRow & {
    productName: string;
    productCode: string;
    unit: string;
    outstandingQty: number;
  })[];
};

export type SalesOrderItemWithProduct = SalesOrderItemRow & {
  productName: string;
  productCode: string;
  unit: string;
};

export async function getSalesOrders(): Promise<SalesOrderWithCustomer[]> {
  return db
    .select({
      id: salesOrders.id,
      soNo: salesOrders.soNo,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      orderDate: salesOrders.orderDate,
      expectedDate: salesOrders.expectedDate,
      notes: salesOrders.notes,
      createdBy: salesOrders.createdBy,
      createdAt: salesOrders.createdAt,
      updatedAt: salesOrders.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(isNull(customers.archivedAt))
    .orderBy(desc(salesOrders.orderDate), desc(salesOrders.createdAt));
}

export async function getSalesOrderById(
  id: string
): Promise<SalesOrderWithDetails | null> {
  const order = await db
    .select({
      id: salesOrders.id,
      soNo: salesOrders.soNo,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      orderDate: salesOrders.orderDate,
      expectedDate: salesOrders.expectedDate,
      notes: salesOrders.notes,
      createdBy: salesOrders.createdBy,
      createdAt: salesOrders.createdAt,
      updatedAt: salesOrders.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(eq(salesOrders.id, id))
    .limit(1);

  if (order.length === 0) return null;

  const items = await db
    .select({
      id: salesOrderItems.id,
      soId: salesOrderItems.soId,
      productId: salesOrderItems.productId,
      qty: salesOrderItems.qty,
      rate: salesOrderItems.rate,
      gstRate: salesOrderItems.gstRate,
      dispatchedQty: salesOrderItems.dispatchedQty,
      createdAt: salesOrderItems.createdAt,
      updatedAt: salesOrderItems.updatedAt,
      productName: products.name,
      productCode: products.code,
      unit: products.unit,
    })
    .from(salesOrderItems)
    .innerJoin(products, eq(salesOrderItems.productId, products.id))
    .where(eq(salesOrderItems.soId, id));

  const itemsWithOutstanding = items.map((item) => ({
    ...item,
    outstandingQty: Number(item.qty) - Number(item.dispatchedQty),
  }));

  return { ...order[0], items: itemsWithOutstanding };
}

export async function getSalesOrderByNo(
  soNo: string
): Promise<SalesOrderWithDetails | null> {
  const order = await db
    .select({
      id: salesOrders.id,
      soNo: salesOrders.soNo,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      orderDate: salesOrders.orderDate,
      expectedDate: salesOrders.expectedDate,
      notes: salesOrders.notes,
      createdBy: salesOrders.createdBy,
      createdAt: salesOrders.createdAt,
      updatedAt: salesOrders.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(eq(salesOrders.soNo, soNo))
    .limit(1);

  if (order.length === 0) return null;

  const items = await db
    .select({
      id: salesOrderItems.id,
      soId: salesOrderItems.soId,
      productId: salesOrderItems.productId,
      qty: salesOrderItems.qty,
      rate: salesOrderItems.rate,
      gstRate: salesOrderItems.gstRate,
      dispatchedQty: salesOrderItems.dispatchedQty,
      createdAt: salesOrderItems.createdAt,
      updatedAt: salesOrderItems.updatedAt,
      productName: products.name,
      productCode: products.code,
      unit: products.unit,
    })
    .from(salesOrderItems)
    .innerJoin(products, eq(salesOrderItems.productId, products.id))
    .where(eq(salesOrderItems.soId, order[0].id));

  const itemsWithOutstanding = items.map((item) => ({
    ...item,
    outstandingQty: Number(item.qty) - Number(item.dispatchedQty),
  }));

  return { ...order[0], items: itemsWithOutstanding };
}

export async function getDraftSalesOrders(): Promise<SalesOrderWithCustomer[]> {
  return db
    .select({
      id: salesOrders.id,
      soNo: salesOrders.soNo,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      orderDate: salesOrders.orderDate,
      expectedDate: salesOrders.expectedDate,
      notes: salesOrders.notes,
      createdBy: salesOrders.createdBy,
      createdAt: salesOrders.createdAt,
      updatedAt: salesOrders.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(eq(salesOrders.status, "draft"))
    .orderBy(desc(salesOrders.orderDate));
}

export async function getActiveSalesOrders(): Promise<SalesOrderWithCustomer[]> {
  return db
    .select({
      id: salesOrders.id,
      soNo: salesOrders.soNo,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      orderDate: salesOrders.orderDate,
      expectedDate: salesOrders.expectedDate,
      notes: salesOrders.notes,
      createdBy: salesOrders.createdBy,
      createdAt: salesOrders.createdAt,
      updatedAt: salesOrders.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(
      and(
        isNull(customers.archivedAt),
        sql`${salesOrders.status} IN ('confirmed', 'partial')`
      )
    )
    .orderBy(desc(salesOrders.orderDate));
}

export async function getSalesOrderCounts(): Promise<{
  draft: number;
  active: number;
  completed: number;
}> {
  const [draftCount, activeCount, completedCount] = await Promise.all([
    db.$count(salesOrders, eq(salesOrders.status, "draft")),
    db.$count(
      salesOrders,
      sql`${salesOrders.status} IN ('confirmed', 'partial')`
    ),
    db.$count(salesOrders, eq(salesOrders.status, "completed")),
  ]);

  return { draft: draftCount, active: activeCount, completed: completedCount };
}

export async function getNextSONumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO-${year}${month}-`;

  const lastOrder = await db
    .select({ soNo: salesOrders.soNo })
    .from(salesOrders)
    .where(sql`${salesOrders.soNo} LIKE ${prefix}%`)
    .orderBy(desc(salesOrders.soNo))
    .limit(1);

  if (lastOrder.length === 0) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastOrder[0].soNo.split("-")[2], 10);
  const nextNumber = String(lastNumber + 1).padStart(3, "0");
  return `${prefix}${nextNumber}`;
}