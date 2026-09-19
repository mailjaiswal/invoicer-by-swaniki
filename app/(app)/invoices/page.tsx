"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Search,
  FileText,
  Plus,
  Copy,
  CheckCircle2,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { useAppCurrency, useToast } from "@/lib/providers";
import { listInvoices, markInvoicePaid, deleteInvoice } from "@/lib/db/invoices";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney, formatDate } from "@/lib/formatting";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/invoice/status-badge";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const EMPTY_INVOICES: Invoice[] = [];

const STATUS_FILTERS: Array<{ value: "all" | InvoiceStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "draft", label: "Draft" },
];

export default function InvoicesPage() {
  useEffect(() => {
    document.body.dataset.doctype = "invoice";
    return () => {
      delete document.body.dataset.doctype;
    };
  }, []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const currency = useAppCurrency();

  const allInvoices =
    useLiveQuery(() => listInvoices(), []) ?? EMPTY_INVOICES;

  const invoices = useMemo(() => {
    const now = new Date();
    const needle = query.trim().toLowerCase();
    return allInvoices.filter((invoice) => {
      const derived = deriveInvoiceStatus(invoice, now);
      if (status !== "all" && derived !== status) return false;
      if (!needle) return true;
      const haystack = [
        invoice.invoiceNumber,
        invoice.customerSnapshot.name,
        invoice.customerSnapshot.company ?? "",
        invoice.customerSnapshot.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allInvoices, query, status]);

  const filtered = query || status !== "all";

  async function handleMarkPaid(invoiceId: string) {
    setPayingId(invoiceId);
    try {
      const updated = await markInvoicePaid(invoiceId);
      showToast(`${updated.invoiceNumber} marked as paid.`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Couldn't update payment.",
        "error"
      );
    } finally {
      setPayingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.id);
      showToast(`${deleteTarget.number} deleted.`);
      setDeleteTarget(null);
    } catch {
      showToast("Couldn't delete the invoice.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Track, duplicate and share your invoices.
          </p>
        </div>
        <Link href="/invoice/new">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New invoice
          </Button>
        </Link>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <Input
            type="search"
            role="searchbox"
            aria-label="Search invoices"
            placeholder="Search by invoice number or customer"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                status === filter.value
                  ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" aria-hidden="true" />}
          title={filtered ? "Nothing matches right now." : "No invoices yet."}
          description={
            filtered
              ? "Try a different search or clear the filters."
              : "Create your first invoice in under a minute."
          }
          action={
            filtered ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Link href="/invoice/new">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create invoice
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {invoices.map((invoice) => {
            const derived = deriveInvoiceStatus(invoice);
            const payable =
              derived === "unpaid" || derived === "partial" || derived === "overdue";
            return (
              <li key={invoice.id}>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
                  <Link
                    href={`/invoice/view?id=${invoice.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-stone-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </span>
                        <StatusBadge status={derived} className="shrink-0" />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-stone-500 dark:text-stone-400">
                        {invoice.customerSnapshot.name || "Unknown customer"}{" "}
                        · {formatDate(invoice.invoiceDate)}
                        {derived === "overdue" && invoice.dueDate
                          ? ` · due ${formatDate(invoice.dueDate)}`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-white">
                      {formatMoney(invoice.total, currency)}
                    </span>
                  </Link>
                  <div className="mt-2 flex justify-end gap-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                    {derived === "draft" ? (
                      <Link
                        href={`/invoice/new?edit=${invoice.id}`}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                        aria-label={`Resume editing ${invoice.invoiceNumber}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Resume editing
                      </Link>
                    ) : (
                      <Link
                        href={`/invoice/new?duplicate=${invoice.id}`}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                        aria-label={`Duplicate ${invoice.invoiceNumber}`}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Duplicate
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(invoice.id)}
                      disabled={!payable || payingId === invoice.id}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800"
                      aria-label={`Mark ${invoice.invoiceNumber} as paid`}
                    >
                      {payingId === invoice.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Mark paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: invoice.id, number: invoice.invoiceNumber })}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      aria-label={`Delete ${invoice.invoiceNumber}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.number ?? ""}?`}
        confirmLabel="Yes, delete"
        tone="danger"
        busy={deleting}
        onConfirm={() => void handleDelete()}
        description="This permanently removes the invoice and its payment records from this device. This can't be undone."
      />
    </div>
  );
}