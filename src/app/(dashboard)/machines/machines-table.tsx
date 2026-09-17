"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Pencil, Plus, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { MachineFormDialog } from "@/components/master-data/machine-form-dialog";
import { archiveMachine } from "@/modules/machines/actions";
import type { Machine } from "@/modules/machines/schema";

export function MachinesTable({ machines }: { machines: Machine[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [archiving, setArchiving] = useState<Machine | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: Machine) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleArchive(row: Machine) {
    const result = await archiveMachine(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<Machine>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Machine",
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
      key: "capacity",
      label: "Capacity",
      align: "right",
      sortable: true,
      sortValue: (row) => row.capacity ?? 0,
      render: (row) => <span className="num">{row.capacity != null ? row.capacity : "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Machines"
        description="Machines used for production planning (DEC-017)."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Machine
          </Button>
        }
      />

      <DataTable
        data={machines}
        columns={columns}
        rowKey={(row) => row.id}
        label="machines"
        search={{ placeholder: "Search by name, code…", keys: (row) => [row.code, row.name, row.notes ?? ""] }}
        empty={{ icon: Wrench, title: "No machines yet", description: "Add the machines your production lines use." }}
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

      <MachineFormDialog open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "machine"}?`}
        description="This hides the machine from active lists. Existing data remains unchanged."
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