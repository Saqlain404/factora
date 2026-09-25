import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dispatches,
  dispatchItems,
  salesOrders,
  salesOrderItems,
  type DispatchRow,
  type DispatchItemRow,
} from "./schema";
import { customers } from "@/modules/customers/schema";
import { products } from "@/modules/products/schema";

export type DispatchWithDetails = DispatchRow & {
  customerName: string;
  customerCode: string;
  soNo: string;
  items: (DispatchItemRow & {
    productName: string;
    productCode: string;
    unit: string;
    soItemQty: number;
    soItemDispatchedQty: number | null;
  })[];
};

export type DispatchListItem = DispatchRow & {
  customerName: string;
  soNo: string;
  itemCount: number;
  totalQty: number;
};

export async function getDispatches(): Promise<DispatchListItem[]> {
  const dispatchList = await db
    .select({
      id: dispatches.id,
      dispatchNo: dispatches.dispatchNo,
      soId: dispatches.soId,
      customerId: dispatches.customerId,
      status: dispatches.status,
      dispatchDate: dispatches.dispatchDate,
      expectedDeliveryDate: dispatches.expectedDeliveryDate,
      actualDeliveryDate: dispatches.actualDeliveryDate,
      vehicleNo: dispatches.vehicleNo,
      driverName: dispatches.driverName,
      driverPhone: dispatches.driverPhone,
      notes: dispatches.notes,
      createdBy: dispatches.createdBy,
      deliveredBy: dispatches.deliveredBy,
      createdAt: dispatches.createdAt,
      updatedAt: dispatches.updatedAt,
      customerName: customers.name,
      soNo: salesOrders.soNo,
    })
    .from(dispatches)
    .innerJoin(customers, eq(dispatches.customerId, customers.id))
    .innerJoin(salesOrders, eq(dispatches.soId, salesOrders.id))
    .orderBy(desc(dispatches.dispatchDate), desc(dispatches.createdAt));

  const dispatchIds = dispatchList.map((d) => d.id);
  const itemCounts: Record<string, { count: number; totalQty: number }> = {};

  if (dispatchIds.length > 0) {
    const items = await db
      .select({
        dispatchId: dispatchItems.dispatchId,
        qty: dispatchItems.qty,
      })
      .from(dispatchItems)
      .where(sql`${dispatchItems.dispatchId} IN (${sql.join(dispatchIds.map((id) => sql`${id}`), sql`, `)})`);

    for (const item of items) {
      if (!itemCounts[item.dispatchId]) {
        itemCounts[item.dispatchId] = { count: 0, totalQty: 0 };
      }
      itemCounts[item.dispatchId].count += 1;
      itemCounts[item.dispatchId].totalQty += Number(item.qty);
    }
  }

  return dispatchList.map((d) => ({
    ...d,
    itemCount: itemCounts[d.id]?.count ?? 0,
    totalQty: itemCounts[d.id]?.totalQty ?? 0,
  }));
}

export async function getDispatchById(
  id: string
): Promise<DispatchWithDetails | null> {
  const dispatch = await db
    .select({
      id: dispatches.id,
      dispatchNo: dispatches.dispatchNo,
      soId: dispatches.soId,
      customerId: dispatches.customerId,
      status: dispatches.status,
      dispatchDate: dispatches.dispatchDate,
      expectedDeliveryDate: dispatches.expectedDeliveryDate,
      actualDeliveryDate: dispatches.actualDeliveryDate,
      vehicleNo: dispatches.vehicleNo,
      driverName: dispatches.driverName,
      driverPhone: dispatches.driverPhone,
      notes: dispatches.notes,
      createdBy: dispatches.createdBy,
      deliveredBy: dispatches.deliveredBy,
      createdAt: dispatches.createdAt,
      updatedAt: dispatches.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
      soNo: salesOrders.soNo,
    })
    .from(dispatches)
    .innerJoin(customers, eq(dispatches.customerId, customers.id))
    .innerJoin(salesOrders, eq(dispatches.soId, salesOrders.id))
    .where(eq(dispatches.id, id))
    .limit(1);

  if (dispatch.length === 0) return null;

  const items = await db
    .select({
      id: dispatchItems.id,
      dispatchId: dispatchItems.dispatchId,
      soItemId: dispatchItems.soItemId,
      productId: dispatchItems.productId,
      qty: dispatchItems.qty,
      createdAt: dispatchItems.createdAt,
      updatedAt: dispatchItems.updatedAt,
      productName: products.name,
      productCode: products.code,
      unit: products.unit,
      soItemQty: salesOrderItems.qty,
      soItemDispatchedQty: salesOrderItems.dispatchedQty,
    })
    .from(dispatchItems)
    .innerJoin(products, eq(dispatchItems.productId, products.id))
    .innerJoin(salesOrderItems, eq(dispatchItems.soItemId, salesOrderItems.id))
    .where(eq(dispatchItems.dispatchId, id));

  return { ...dispatch[0], items };
}

export async function getDispatchByNo(
  dispatchNo: string
): Promise<DispatchWithDetails | null> {
  const dispatch = await db
    .select({
      id: dispatches.id,
      dispatchNo: dispatches.dispatchNo,
      soId: dispatches.soId,
      customerId: dispatches.customerId,
      status: dispatches.status,
      dispatchDate: dispatches.dispatchDate,
      expectedDeliveryDate: dispatches.expectedDeliveryDate,
      actualDeliveryDate: dispatches.actualDeliveryDate,
      vehicleNo: dispatches.vehicleNo,
      driverName: dispatches.driverName,
      driverPhone: dispatches.driverPhone,
      notes: dispatches.notes,
      createdBy: dispatches.createdBy,
      deliveredBy: dispatches.deliveredBy,
      createdAt: dispatches.createdAt,
      updatedAt: dispatches.updatedAt,
      customerName: customers.name,
      customerCode: customers.code,
      soNo: salesOrders.soNo,
    })
    .from(dispatches)
    .innerJoin(customers, eq(dispatches.customerId, customers.id))
    .innerJoin(salesOrders, eq(dispatches.soId, salesOrders.id))
    .where(eq(dispatches.dispatchNo, dispatchNo))
    .limit(1);

  if (dispatch.length === 0) return null;

  const items = await db
    .select({
      id: dispatchItems.id,
      dispatchId: dispatchItems.dispatchId,
      soItemId: dispatchItems.soItemId,
      productId: dispatchItems.productId,
      qty: dispatchItems.qty,
      createdAt: dispatchItems.createdAt,
      updatedAt: dispatchItems.updatedAt,
      productName: products.name,
      productCode: products.code,
      unit: products.unit,
      soItemQty: salesOrderItems.qty,
      soItemDispatchedQty: salesOrderItems.dispatchedQty,
    })
    .from(dispatchItems)
    .innerJoin(products, eq(dispatchItems.productId, products.id))
    .innerJoin(salesOrderItems, eq(dispatchItems.soItemId, salesOrderItems.id))
    .where(eq(dispatchItems.dispatchId, dispatch[0].id));

  return { ...dispatch[0], items };
}

export async function getDispatchCounts(): Promise<{
  pending: number;
  inTransit: number;
  delivered: number;
}> {
  const [pendingCount, inTransitCount, deliveredCount] = await Promise.all([
    db.$count(dispatches, eq(dispatches.status, "pending")),
    db.$count(dispatches, eq(dispatches.status, "in_transit")),
    db.$count(dispatches, eq(dispatches.status, "delivered")),
  ]);

  return { pending: pendingCount, inTransit: inTransitCount, delivered: deliveredCount };
}

export async function getNextDispatchNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `DISP-${year}${month}-`;

  const lastDispatch = await db
    .select({ dispatchNo: dispatches.dispatchNo })
    .from(dispatches)
    .where(sql`${dispatches.dispatchNo} LIKE ${prefix}%`)
    .orderBy(desc(dispatches.dispatchNo))
    .limit(1);

  if (lastDispatch.length === 0) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastDispatch[0].dispatchNo.split("-")[2], 10);
  const nextNumber = String(lastNumber + 1).padStart(3, "0");
  return `${prefix}${nextNumber}`;
}

export async function getSalesOrderDispatchableItems(soId: string) {
  return db
    .select({
      id: salesOrderItems.id,
      productId: salesOrderItems.productId,
      productName: products.name,
      productCode: products.code,
      unit: products.unit,
      qty: salesOrderItems.qty,
      dispatchedQty: salesOrderItems.dispatchedQty,
      outstandingQty: sql<number>`${salesOrderItems.qty} - ${salesOrderItems.dispatchedQty}`,
      rate: salesOrderItems.rate,
      gstRate: salesOrderItems.gstRate,
    })
    .from(salesOrderItems)
    .innerJoin(products, eq(salesOrderItems.productId, products.id))
    .where(
      and(
        eq(salesOrderItems.soId, soId),
        sql`${salesOrderItems.qty} > ${salesOrderItems.dispatchedQty}`
      )
    );
}