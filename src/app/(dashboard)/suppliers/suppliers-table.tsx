"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Building2, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { SupplierFormDialog } from "@/components/master-data/supplier-form-dialog";
import { archiveSupplier } from "@/modules/suppliers/actions";
import type { Supplier } from "@/modules/suppliers/schema";

export function SuppliersTable({
  suppliers,
}: {
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [archiving, setArchiving] = useState<Supplier | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: Supplier) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleArchive(row: Supplier) {
    const result = await archiveSupplier(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<Supplier>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Supplier",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "contactPhone",
      label: "Contact",
      hideOnMobile: true,
      render: (row) => <span className="num">{row.contactPhone || "—"}</span>,
    },
    {
      key: "gstin",
      label: "GSTIN",
      hideOnMobile: true,
      render: (row) => <span className="num font-mono text-xs">{row.gstin || "—"}</span>,
    },
    {
      key: "address",
      label: "Address",
      hideOnMobile: true,
      render: (row) => (
        <span className="line-clamp-1 max-w-56 text-muted-foreground">{row.address || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Suppliers you purchase raw materials from (DEC-016)."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Supplier
          </Button>
        }
      />

      <DataTable
        data={suppliers}
        columns={columns}
        rowKey={(row) => row.id}
        label="suppliers"
        search={{ placeholder: "Search by name, code, phone, GSTIN…", keys: (row) => [row.code, row.name, row.contactPhone ?? "", row.email ?? "", row.gstin ?? "", row.address ?? ""] }}
        empty={{ icon: Building2, title: "No suppliers yet", description: "Add the suppliers you order raw materials from." }}
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

      <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "supplier"}?`}
        description="This hides the supplier from active lists. Existing purchase orders and receipts remain unchanged."
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