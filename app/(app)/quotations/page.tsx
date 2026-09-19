"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Search,
  ScrollText,
  Plus,
  Copy,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { useAppCurrency, useToast } from "@/lib/providers";
import { listQuotations, deleteInvoice } from "@/lib/db/invoices";
import { formatMoney, formatDate } from "@/lib/formatting";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { Invoice } from "@/lib/types";

const EMPTY_QUOTATIONS: Invoice[] = [];

export default function QuotationsPage() {
  useEffect(() => {
    document.body.dataset.doctype = "quotation";
    return () => {
      delete document.body.dataset.doctype;
    };
  }, []);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const currency = useAppCurrency();

  const allQuotations =
    useLiveQuery(() => listQuotations(), []) ?? EMPTY_QUOTATIONS;

  const quotations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allQuotations;
    return allQuotations.filter((quotation) => {
      const haystack = [
        quotation.invoiceNumber,
        quotation.customerSnapshot.name,
        quotation.customerSnapshot.company ?? "",
        quotation.customerSnapshot.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allQuotations, query]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.id);
      showToast(`${deleteTarget.number} deleted.`);
      setDeleteTarget(null);
    } catch {
      showToast("Couldn't delete the quotation.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Quotations
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Share a quote, then convert it to an invoice when it&apos;s accepted.
          </p>
        </div>
        <Link href="/invoice/new?type=quotation">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New quotation
          </Button>
        </Link>
      </header>

      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <Input
            type="search"
            role="searchbox"
            aria-label="Search quotations"
            placeholder="Search by quotation number or customer"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-7 w-7" aria-hidden="true" />}
          title={query ? "Nothing matches right now." : "No quotations yet."}
          description={
            query
              ? "Try a different search or clear the filter."
              : "Create a quotation before sending an invoice."
          }
          action={
            query ? (
              <Button
                variant="secondary"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            ) : (
              <Link href="/invoice/new?type=quotation">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create quotation
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {quotations.map((quotation) => (
            <li key={quotation.id}>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
                <Link
                  href={`/invoice/view?id=${quotation.id}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
                    <ScrollText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-900 dark:text-white">
                      {quotation.invoiceNumber}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-stone-500 dark:text-stone-400">
                      {quotation.customerSnapshot.name || "Unknown customer"}{" "}
                      · Issued {formatDate(quotation.invoiceDate)}
                      {quotation.validityDate
                        ? ` · Valid until ${formatDate(quotation.validityDate)}`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-stone-900 dark:text-white">
                    {formatMoney(quotation.total, currency)}
                  </span>
                </Link>
                <div className="mt-2 flex justify-end gap-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                  <Link
                    href={`/invoice/new?duplicate=${quotation.id}&type=invoice`}
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    aria-label={`Convert ${quotation.invoiceNumber} to an invoice`}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Convert to invoice
                  </Link>
                  <Link
                    href={`/invoice/new?duplicate=${quotation.id}&type=quotation`}
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    aria-label={`Duplicate ${quotation.invoiceNumber}`}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Duplicate
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: quotation.id, number: quotation.invoiceNumber })}
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    aria-label={`Delete ${quotation.invoiceNumber}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
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
        description="This permanently removes the quotation from this device. This can't be undone."
      />
    </div>
  );
}