"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArrowRight, Pencil, Plus, Factory } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { MOULD_STATUS } from "@/components/status/definitions";
import { MouldFormDialog } from "@/components/master-data/mould-form-dialog";
import { advanceMouldStatus, archiveMould } from "@/modules/moulds/actions";
import { MOULD_STATUSES } from "@/modules/moulds/domain";
import { cn } from "cn";
import { formatCurrency } from "@/lib/utils";
import type { MouldWithSupplier } from "@/modules/moulds/queries";
import type { Supplier } from "@/modules/suppliers/schema";

function MouldStepper({ status }: { status: MouldWithSupplier["status"] }) {
  const currentIndex = MOULD_STATUSES.indexOf(status);
  return (
    <div className="hidden items-center gap-0.5 lg:flex" aria-hidden>
      {MOULD_STATUSES.map((step, index) => {
        const meta = MOULD_STATUS[step];
        return (
          <span
            key={step}
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium",
              index < currentIndex && "text-primary/80",
              index === currentIndex && "text-foreground",
              index > currentIndex && "text-muted-foreground/50"
            )}
          >
            {index > 0 ? <ArrowRight className="size-2.5" /> : null}
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export function MouldsTable({
  moulds,
  suppliers,
}: {
  moulds: MouldWithSupplier[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MouldWithSupplier | null>(null);
  const [advancing, setAdvancing] = useState<MouldWithSupplier | null>(null);
  const [archiving, setArchiving] = useState<MouldWithSupplier | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: MouldWithSupplier) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleAdvance(row: MouldWithSupplier) {
    const result = await advanceMouldStatus(row.id);
    if (result.ok) {
      toast.success(`${row.name} moved to ${MOULD_STATUS[result.data.status].label}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleArchive(row: MouldWithSupplier) {
    const result = await archiveMould(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<MouldWithSupplier>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Mould",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "status",
      label: "Lifecycle",
      sortable: true,
      sortValue: (row) => MOULD_STATUSES.indexOf(row.status),
      render: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={row.status} map={MOULD_STATUS} />
          <MouldStepper status={row.status} />
        </div>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{row.supplierName || "—"}</span>,
    },
    {
      key: "cost",
      label: "Cost",
      align: "right",
      sortable: true,
      sortValue: (row) => row.cost ?? 0,
      render: (row) => <span className="num">{formatCurrency(row.cost)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moulds"
        description="Strict lifecycle Required → Ordered → Received → Trial → Active (DEC-015)."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Mould
          </Button>
        }
      />

      <DataTable
        data={moulds}
        columns={columns}
        rowKey={(row) => row.id}
        label="moulds"
        search={{ placeholder: "Search by name, code, supplier…", keys: (row) => [row.code, row.name, row.supplierName ?? ""] }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: MOULD_STATUSES.map((status) => ({ value: status, label: MOULD_STATUS[status].label })),
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
        empty={{ icon: Factory, title: "No moulds yet", description: "Add the moulds used to make products." }}
        getRowActions={(row) => (
          <>
            {row.status !== "active" ? (
              <Button variant="outline" size="sm" onClick={() => setAdvancing(row)}>
                Next Step
              </Button>
            ) : null}
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

      <MouldFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editing}
        suppliers={suppliers}
      />

      <ConfirmDialog
        open={advancing != null}
        onOpenChange={(open) => {
          if (!open) setAdvancing(null);
        }}
        title={`Advance ${advancing?.name ?? "mould"} to next stage?`}
        description={
          advancing?.status != null ? (
            <span>
              Moves{" "}
              <span className="font-medium text-foreground">{advancing.name}</span> from{" "}
              <span className="font-medium text-foreground">{MOULD_STATUS[advancing.status].label}</span> to{" "}
              <span className="font-medium text-foreground">
                {MOULD_STATUS[MOULD_STATUSES[MOULD_STATUSES.indexOf(advancing.status) + 1]].label}
              </span>
              .
            </span>
          ) : undefined
        }
        confirmLabel="Advance"
        onConfirm={async () => {
          if (advancing) await handleAdvance(advancing);
          setAdvancing(null);
        }}
      />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "mould"}?`}
        description="This hides the mould from active lists. Existing products and BOMs remain unchanged."
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