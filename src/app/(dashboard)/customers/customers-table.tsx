"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Pencil, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { CustomerFormDialog } from "@/components/master-data/customer-form-dialog";
import { archiveCustomer } from "@/modules/customers/actions";
import type { Customer } from "@/modules/customers/schema";

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [archiving, setArchiving] = useState<Customer | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: Customer) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleArchive(row: Customer) {
    const result = await archiveCustomer(row.id);
    if (result.ok) {
      toast.success(`${row.name} archived`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: Column<Customer>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => <Badge variant="secondary" className="num font-mono">{row.code}</Badge>,
    },
    {
      key: "name",
      label: "Customer",
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
      key: "state",
      label: "State",
      hideOnMobile: true,
      render: (row) => row.state,
    },
    {
      key: "creditPeriodDays",
      label: "Credit",
      align: "right",
      sortable: true,
      sortValue: (row) => row.creditPeriodDays,
      render: (row) => <span className="num">{row.creditPeriodDays} days</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer master with per-customer credit period (DEC-018)."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Add Customer
          </Button>
        }
      />

      <DataTable
        data={customers}
        columns={columns}
        rowKey={(row) => row.id}
        label="customers"
        search={{ placeholder: "Search by name, code, phone, GSTIN…", keys: (row) => [row.code, row.name, row.contactPhone ?? "", row.email ?? "", row.gstin ?? "", row.state] }}
        empty={{ icon: Users, title: "No customers yet", description: "Add your first customer with their credit terms to start invoicing them." }}
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

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={`Archive ${archiving?.name ?? "customer"}?`}
        description="This hides the customer from active lists. Existing orders and invoices remain unchanged."
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