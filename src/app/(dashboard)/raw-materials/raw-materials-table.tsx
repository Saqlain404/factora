"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Boxes, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { RawMaterialFormDialog } from "@/components/master-data/raw-material-form-dialog";
import { archiveRawMaterial } from "@/modules/raw-materials/actions";
import { formatCurrency } from "@/lib/utils";
import type { RawMaterial } from "@/modules/raw-materials/schema";

export function RawMaterialsTable({
  rawMaterials,
}: {
  rawMaterials: RawMaterial[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [archiving, setArchiving] = useState<RawMaterial | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: RawMaterial) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleArchive(row: RawMaterial) {
    const result = await archiveRawMaterial(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<RawMaterial>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Material",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.name}</p>
          {row.notes ? (
            <p className="line-clamp-1 max-w-72 text-xs text-muted-foreground">{row.notes}</p>
          ) : null}
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
      key: "currentRate",
      label: "Rate",
      align: "right",
      sortable: true,
      sortValue: (row) => row.currentRate,
      render: (row) => <span className="num">{formatCurrency(row.currentRate)}</span>,
    },
    {
      key: "gstRate",
      label: "GST",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      sortValue: (row) => row.gstRate ?? 0,
      render: (row) => <span className="num">{row.gstRate ?? 0}%</span>,
    },
    {
      key: "minStockQty",
      label: "Min stock",
      align: "right",
      sortable: true,
      sortValue: (row) => row.minStockQty,
      render: (row) => (
        <span className="num">
          {Number(row.minStockQty).toLocaleString("en-IN")} {row.unit}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raw Materials"
        description="Raw material master (resin, additives) feeding procurement & inventory."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Raw Material
          </Button>
        }
      />

      <DataTable
        data={rawMaterials}
        columns={columns}
        rowKey={(row) => row.id}
        label="raw materials"
        search={{ placeholder: "Search by name, code, HSN…", keys: (row) => [row.code, row.name, row.hsnCode ?? "", row.notes ?? ""] }}
        empty={{ icon: Boxes, title: "No raw materials yet", description: "Add resin and additives you procure. Stock tracking lives under Inventory." }}
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

      <RawMaterialFormDialog open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "material"}?`}
        description="This hides the material from active lists. Existing purchase orders, receipts and stock history remain unchanged."
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