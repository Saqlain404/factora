"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Pencil, Plus, ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ProductFormDialog } from "@/components/master-data/product-form-dialog";
import { archiveProduct } from "@/modules/products/actions";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithMould } from "@/modules/products/queries";
import type { Mould } from "@/modules/moulds/schema";

export function ProductsTable({
  products,
  moulds,
}: {
  products: ProductWithMould[];
  moulds: Mould[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithMould | null>(null);
  const [archiving, setArchiving] = useState<ProductWithMould | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: ProductWithMould) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleArchive(row: ProductWithMould) {
    const result = await archiveProduct(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<ProductWithMould>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Product",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.mouldName ? `Mould: ${row.mouldName}` : "No mould linked"}
          </p>
        </div>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      hideOnMobile: true,
      render: (row) => row.unit,
    },
    {
      key: "hsnCode",
      label: "HSN",
      hideOnMobile: true,
      render: (row) => <span className="num font-mono text-xs">{row.hsnCode || "—"}</span>,
    },
    {
      key: "gstRate",
      label: "GST",
      align: "right",
      sortable: true,
      sortValue: (row) => row.gstRate ?? 0,
      render: (row) => <span className="num">{row.gstRate ?? 0}%</span>,
    },
    {
      key: "sellingPrice",
      label: "Selling price",
      align: "right",
      sortable: true,
      sortValue: (row) => row.sellingPrice ?? 0,
      render: (row) => (
        <span className="num font-medium tabular-nums">{formatCurrency(row.sellingPrice)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Finished products referencing their mould for orders & BOMs (DEC-017)."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Product
          </Button>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        rowKey={(row) => row.id}
        label="products"
        search={{ placeholder: "Search by name, code, mould, HSN…", keys: (row) => [row.code, row.name, row.mouldName ?? "", row.hsnCode ?? ""] }}
        empty={{ icon: ShoppingBasket, title: "No products yet", description: "Add the parts you manufacture, each linked to a mould." }}
        getRowActions={(row) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
              <Pencil aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setArchiving(row)}
              aria-label={`Archive ${row.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Archive aria-hidden />
            </Button>
          </>
        )}
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editing}
        moulds={moulds}
      />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "product"}?`}
        description="This hides the product from active lists. Existing orders and BOMs remain unchanged."
        confirmLabel="Archive"
        tone="danger"
        onConfirm={async () => {
          if (archiving) await handleArchive(archiving);
          setArchiving(null);
        }}
      />
    </div>
  );
}