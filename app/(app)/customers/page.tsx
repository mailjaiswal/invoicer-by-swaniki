"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Button } from "@/components/common/button";
import { Sheet } from "@/components/common/sheet";
import { Card, CardContent } from "@/components/common/card";
import { EmptyState } from "@/components/common/empty-state";
import { useToast } from "@/lib/providers";
import { deleteCustomer, listCustomers, upsertCustomer } from "@/lib/db/records";
import type { Customer, CustomerDraft } from "@/lib/types";

interface CustomerForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  notes: string;
}

function blankForm(): CustomerForm {
  return { name: "", company: "", email: "", phone: "", address: "", gstin: "", notes: "" };
}

function formFromCustomer(customer: Customer): CustomerForm {
  return {
    name: customer.name ?? "",
    company: customer.company ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    gstin: customer.gstin ?? "",
    notes: customer.notes ?? "",
  };
}

export default function CustomersPage() {
  const customers = useLiveQuery(() => listCustomers(), []);
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(blankForm());
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const filtered = useMemo(() => {
    if (!customers) return customers;
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.company ?? "", customer.email ?? "", customer.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [customers, query]);

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm(formFromCustomer(customer));
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }
    setBusy("save");
    try {
      const draft: CustomerDraft = {
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      await upsertCustomer(draft, editing?.id ?? null);
      setFormOpen(false);
      showToast(
        editing ? "Customer updated." : "Customer added.",
        "success"
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't save the customer.", "error");
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy("delete");
    try {
      await deleteCustomer(deleting.id);
      showToast(`${deleting.name} removed.`);
      setDeleting(null);
    } catch {
      showToast("Couldn't remove the customer.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            The people and businesses you invoice.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add customer
        </Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
        <Input
          type="search"
          role="searchbox"
          aria-label="Search customers"
          placeholder="Search by name, company, email or phone"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!customers ? (
        <p className="py-8 text-center text-sm text-stone-500">
          Loading customers…
        </p>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={() => openEdit(customer)}
              onDelete={() => setDeleting(customer)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-7 w-7" aria-hidden="true" />}
          title={query.trim() ? "No customers match your search." : "Customers you invoice regularly will appear here."}
          description={
            query.trim()
              ? "Try a different search."
              : "No need to add one first — you can save a customer right when you create an invoice."
          }
          action={
            query.trim() ? undefined : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add customer
              </Button>
            )
          }
        />
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit customer" : "Add customer"}
        description={editing ? `Update details for ${editing.name}.` : "Save a customer to autofill future invoices."}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              autoFocus
              placeholder="e.g. Aarav Kapoor"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="customer-company">
              Company <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="customer-company"
              placeholder="e.g. Bharat Web Studio"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              placeholder="Street, city, state — PIN"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="customer-gstin">
              GSTIN <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="customer-gstin"
              placeholder="22AAAAA0000A1Z5"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="customer-notes">
              Notes <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="customer-notes"
              placeholder="Preferences, billing details…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={submitForm} disabled={busy === "save"}>
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editing ? "Save changes" : "Add customer"}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove this customer?"
        description="The customer's past invoices stay untouched. This just removes them from your list."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">{deleting?.name}</p>
            {deleting?.company && <p className="mt-0.5 text-xs opacity-80">{deleting.company}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDelete}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Remove
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="transition-colors hover:border-stone-300 dark:hover:border-stone-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-stone-950 dark:text-white">
                {customer.name}
              </span>
              {customer.gstin && (
                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  GST
                </span>
              )}
            </p>
            {customer.company && (
              <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">
                {customer.company}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${customer.name}`} onClick={onEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${customer.name}`} onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {(customer.phone || customer.email || customer.address) && (
          <ul className="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-300">
            {customer.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
                <span className="truncate">{customer.phone}</span>
              </li>
            )}
            {customer.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
                <span className="truncate">{customer.email}</span>
              </li>
            )}
            {customer.address && (
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
                <span className="truncate">{customer.address}</span>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}