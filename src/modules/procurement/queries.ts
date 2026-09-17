import "server-only";

import { asc, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers } from "@/modules/suppliers/schema";
import { rawMaterials } from "@/modules/raw-materials/schema";
import { purchaseOrders, purchaseOrderItems, purchaseReceipts } from "./schema";

export type PurchaseOrderWithSupplier = typeof purchaseOrders.$inferSelect & {
  supplierName: string;
};

export async function listPurchaseOrders(): Promise<PurchaseOrderWithSupplier[]> {
  const rows = await db
    .select({
      id: purchaseOrders.id,
      poNo: purchaseOrders.poNo,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      orderDate: purchaseOrders.orderDate,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    })
    .from(purchaseOrders)
    .innerJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .orderBy(desc(purchaseOrders.createdAt));
  return rows;
}

export async function listConfirmedPurchaseOrders(): Promise<PurchaseOrderWithSupplier[]> {
  const rows = await db
    .select({
      id: purchaseOrders.id,
      poNo: purchaseOrders.poNo,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      orderDate: purchaseOrders.orderDate,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    })
    .from(purchaseOrders)
    .innerJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .where(or(eq(purchaseOrders.status, "confirmed"), eq(purchaseOrders.status, "received")))
    .orderBy(desc(purchaseOrders.createdAt));
  return rows;
}

export type PurchaseOrderItemRow = typeof purchaseOrderItems.$inferSelect & {
  materialName: string;
  materialUnit: string;
  receivedQty: number;
};

export type PurchaseOrderDetail = {
  order: PurchaseOrderWithSupplier;
  items: PurchaseOrderItemRow[];
};

export async function getPurchaseOrderDetail(
  id: string
): Promise<PurchaseOrderDetail | null> {
  const [orderRow] = await db
    .select({
      id: purchaseOrders.id,
      poNo: purchaseOrders.poNo,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      orderDate: purchaseOrders.orderDate,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    })
    .from(purchaseOrders)
    .innerJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .where(eq(purchaseOrders.id, id))
    .limit(1);
  if (!orderRow) return null;

  const [itemRows, receiptRows] = await Promise.all([
    db
      .select({
        id: purchaseOrderItems.id,
        poId: purchaseOrderItems.poId,
        rawMaterialId: purchaseOrderItems.rawMaterialId,
        materialName: rawMaterials.name,
        materialUnit: rawMaterials.unit,
        qty: purchaseOrderItems.qty,
        rate: purchaseOrderItems.rate,
        gstRate: purchaseOrderItems.gstRate,
        createdAt: purchaseOrderItems.createdAt,
        updatedAt: purchaseOrderItems.updatedAt,
      })
      .from(purchaseOrderItems)
      .innerJoin(rawMaterials, eq(rawMaterials.id, purchaseOrderItems.rawMaterialId))
      .where(eq(purchaseOrderItems.poId, id))
      .orderBy(asc(rawMaterials.name)),
    db
      .select({
        rawMaterialId: purchaseReceipts.rawMaterialId,
        qty: purchaseReceipts.qty,
      })
      .from(purchaseReceipts)
      .where(eq(purchaseReceipts.poId, id)),
  ]);

  const receivedByMaterial = new Map<string, number>();
  for (const receipt of receiptRows) {
    if (receipt.rawMaterialId == null) continue;
    receivedByMaterial.set(
      receipt.rawMaterialId,
      (receivedByMaterial.get(receipt.rawMaterialId) ?? 0) + receipt.qty
    );
  }

  const items = itemRows.map((item) => ({
    ...item,
    receivedQty: receivedByMaterial.get(item.rawMaterialId) ?? 0,
  }));

  return { order: orderRow, items };
}

export type PurchaseReceiptRow = typeof purchaseReceipts.$inferSelect & {
  materialName: string;
  poNo: string;
  supplierName: string;
};

export async function listPurchaseReceipts(): Promise<PurchaseReceiptRow[]> {
  return db
    .select({
      id: purchaseReceipts.id,
      poId: purchaseReceipts.poId,
      rawMaterialId: purchaseReceipts.rawMaterialId,
      materialName: rawMaterials.name,
      qty: purchaseReceipts.qty,
      rate: purchaseReceipts.rate,
      gstRate: purchaseReceipts.gstRate,
      billNo: purchaseReceipts.billNo,
      billDate: purchaseReceipts.billDate,
      receivedAt: purchaseReceipts.receivedAt,
      userId: purchaseReceipts.userId,
      note: purchaseReceipts.note,
      createdAt: purchaseReceipts.createdAt,
      poNo: purchaseOrders.poNo,
      supplierName: suppliers.name,
    })
    .from(purchaseReceipts)
    .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseReceipts.poId))
    .innerJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .innerJoin(rawMaterials, eq(rawMaterials.id, purchaseReceipts.rawMaterialId))
    .orderBy(desc(purchaseReceipts.receivedAt), desc(purchaseReceipts.createdAt));
}

export type ConfirmedOrderWithItems = PurchaseOrderWithSupplier & {
  items: {
    rawMaterialId: string;
    materialName: string;
    materialUnit: string;
    orderQty: number;
    receivedQty: number;
    outstandingQty: number;
  }[];
};

export async function listConfirmedOrdersWithItems(): Promise<ConfirmedOrderWithItems[]> {
  const orders = await listConfirmedPurchaseOrders();
  if (orders.length === 0) return [];

  const [itemRows, receiptRows] = await Promise.all([
    db
      .select({
        poId: purchaseOrderItems.poId,
        rawMaterialId: purchaseOrderItems.rawMaterialId,
        materialName: rawMaterials.name,
        materialUnit: rawMaterials.unit,
        qty: purchaseOrderItems.qty,
      })
      .from(purchaseOrderItems)
      .innerJoin(rawMaterials, eq(rawMaterials.id, purchaseOrderItems.rawMaterialId))
      .orderBy(asc(rawMaterials.name)),
    db
      .select({
        poId: purchaseReceipts.poId,
        rawMaterialId: purchaseReceipts.rawMaterialId,
        qty: purchaseReceipts.qty,
      })
      .from(purchaseReceipts),
  ]);

  const itemsByPo = new Map<
    string,
    ConfirmedOrderWithItems["items"]
  >();
  for (const item of itemRows) {
    const group = itemsByPo.get(item.poId) ?? [];
    group.push({
      rawMaterialId: item.rawMaterialId,
      materialName: item.materialName,
      materialUnit: item.materialUnit,
      orderQty: item.qty,
      receivedQty: 0,
      outstandingQty: item.qty,
    });
    itemsByPo.set(item.poId, group);
  }
  const receivedByPoAndMaterial = new Map<string, number>();
  for (const receipt of receiptRows) {
    if (receipt.rawMaterialId == null) continue;
    receivedByPoAndMaterial.set(
      `${receipt.poId}:${receipt.rawMaterialId}`,
      (receivedByPoAndMaterial.get(`${receipt.poId}:${receipt.rawMaterialId}`) ?? 0) +
        receipt.qty
    );
  }

  return orders
    .map((order) => ({
      ...order,
      items: (itemsByPo.get(order.id) ?? []).map((item) => ({
        ...item,
        receivedQty:
          receivedByPoAndMaterial.get(`${order.id}:${item.rawMaterialId}`) ?? 0,
        outstandingQty:
          item.orderQty -
          (receivedByPoAndMaterial.get(`${order.id}:${item.rawMaterialId}`) ?? 0),
      })),
    }))
    .filter((order) => order.items.some((item) => item.outstandingQty > 0));
}

export function isReceivableStatus(status: string): boolean {
  return status === "confirmed" || status === "received";
}