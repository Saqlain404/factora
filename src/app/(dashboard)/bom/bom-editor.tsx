"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BomItemDialog } from "./bom-item-dialog";
import { deleteBomItem } from "@/modules/bom/actions";
import type { BomRow } from "@/modules/bom/queries";
import type { ProductWithMould } from "@/modules/products/queries";
import type { RawMaterial } from "@/modules/raw-materials/schema";

export function BomEditor({
  products,
  rawMaterials,
  bomRows,
}: {
  products: ProductWithMould[];
  rawMaterials: RawMaterial[];
  bomRows: BomRow[];
}) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id ?? ""
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BomRow | null>(null);
  const [removing, setRemoving] = useState<BomRow | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const rows = useMemo(
    () => bomRows.filter((row) => row.productId === selectedProductId),
    [bomRows, selectedProductId]
  );
  const usedMaterialIds = new Set(rows.map((row) => row.rawMaterialId));
  const availableMaterials = rawMaterials.filter(
    (material) => !usedMaterialIds.has(material.id)
  );

  function openCreate() {
    if (!selectedProductId) {
      toast.error("Select a product first");
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: BomRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleDelete(row: BomRow) {
    const result = await deleteBomItem(row.id);
    if (result.ok) {
      toast.success("BOM item removed");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="BOM"
        description="Bill of materials — raw material and quantity per unit of a product. Single active BOM per product."
        actions={
          <Button onClick={openCreate} disabled={!selectedProductId}>
            <Plus aria-hidden />
            Add Material
          </Button>
        }
      />

      <div className="flex max-w-xs items-center gap-2">
        <span className="text-sm text-muted-foreground">Product</span>
        <Select
          value={selectedProductId}
          onValueChange={(value) => {
            if (value !== null) setSelectedProductId(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedProduct.name}</CardTitle>
            <CardDescription>
              {rows.length} material(s) per unit of this product (qty per unit)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Material</TableHead>
                  <TableHead className="text-right">Qty per Unit</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No BOM defined yet. Add the raw materials used per unit.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.materialName}</TableCell>
                    <TableCell className="text-right">{row.qtyPerUnit}</TableCell>
                    <TableCell>{row.materialUnit}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Edit">
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRemoving(row)}
                          aria-label="Remove"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedProductId && (
        <BomItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={selectedProductId}
          row={editing}
          availableMaterials={
            editing
              ? rawMaterials.filter(
                  (material) =>
                    material.id === editing.rawMaterialId || !usedMaterialIds.has(material.id)
                )
              : availableMaterials
          }
          currentMaterialId={editing?.rawMaterialId ?? null}
        />
      )}

      <ConfirmDialog
        open={removing != null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={`Remove ${removing?.materialName ?? "material"} from BOM?`}
        description={`Removes this material from the ${selectedProduct?.name ?? "product"} bill of materials.`}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={async () => {
          if (removing) await handleDelete(removing);
          setRemoving(null);
        }}
      />
    </div>
  );
}