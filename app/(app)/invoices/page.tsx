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
  Upload,
} from "lucide-react";
import { useAppCurrency, useToast } from "@/lib/providers";
import { listInvoices, markInvoicePaid, deleteInvoice, renameInvoice, saveUploadedInvoice } from "@/lib/db/invoices";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney, formatDate } from "@/lib/formatting";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Textarea } from "@/components/common/textarea";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Sheet } from "@/components/common/sheet";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/invoice/status-badge";
import { cn, formatDateInput } from "@/lib/utils";
import type { Invoice, InvoiceAttachment, InvoiceStatus } from "@/lib/types";

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
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<InvoiceAttachment | null>(null);
  const [uploadNumber, setUploadNumber] = useState("");
  const [uploadCustomer, setUploadCustomer] = useState("");
  const [uploadDate, setUploadDate] = useState(() => formatDateInput(new Date()));
  const [uploadTotal, setUploadTotal] = useState("");
  const [uploadPaid, setUploadPaid] = useState(true);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
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

  async function handleRename(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Please enter an invoice name or number.");
      return;
    }
    setRenaming(true);
    setRenameError("");
    try {
      await renameInvoice(renameTarget.id, trimmed);
      showToast(`Invoice renamed to ${trimmed}.`);
      setRenameTarget(null);
    } catch (error) {
      setRenameError(
        error instanceof Error ? error.message : "Couldn't rename the invoice."
      );
    } finally {
      setRenaming(false);
    }
  }

  function resetUploadForm() {
    setUploadFile(null);
    setUploadNumber("");
    setUploadCustomer("");
    setUploadDate(formatDateInput(new Date()));
    setUploadTotal("");
    setUploadPaid(true);
    setUploadNotes("");
    setUploadError("");
  }

  function handlePickUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError("File is larger than 15 MB. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setUploadError("Couldn't read that file.");
        return;
      }
      setUploadFile({
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        dataUrl,
        fileSize: file.size,
      });
      if (!uploadNumber.trim()) {
        const stem = file.name.replace(/\.[^/.]+$/, "").trim();
        if (stem) setUploadNumber(stem.slice(0, 50));
      }
    };
    reader.onerror = () => setUploadError("Couldn't read that file.");
    reader.readAsDataURL(file);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select an invoice PDF or image file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const saved = await saveUploadedInvoice({
        invoiceNumber: uploadNumber,
        customerName: uploadCustomer,
        invoiceDate: uploadDate,
        total: Number(uploadTotal) || 0,
        paid: uploadPaid,
        notes: uploadNotes,
        attachment: uploadFile,
      });
      showToast(`Saved ${saved.invoiceNumber} to your records.`);
      setUploadOpen(false);
      resetUploadForm();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Couldn't save the uploaded invoice."
      );
    } finally {
      setUploading(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetUploadForm();
              setUploadOpen(true);
            }}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload invoice
          </Button>
          <Link href="/invoice/new">
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New invoice
            </Button>
          </Link>
        </div>
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
                        {invoice.attachment && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            Uploaded
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRenameTarget({ id: invoice.id, number: invoice.invoiceNumber });
                            setRenameValue(invoice.invoiceNumber);
                            setRenameError("");
                          }}
                          className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                          title="Rename invoice"
                          aria-label={`Rename ${invoice.invoiceNumber}`}
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                        </button>
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
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget({ id: invoice.id, number: invoice.invoiceNumber });
                        setRenameValue(invoice.invoiceNumber);
                        setRenameError("");
                      }}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                      aria-label={`Rename ${invoice.invoiceNumber}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Rename
                    </button>
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

      <Sheet
        open={renameTarget !== null}
        onClose={() => {
          if (!renaming) setRenameTarget(null);
        }}
        title="Rename invoice"
        description={`Update the name or document number for ${renameTarget?.number ?? "this invoice"}.`}
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <Label htmlFor="rename-invoice-input">Invoice name or number</Label>
            <Input
              id="rename-invoice-input"
              autoFocus
              placeholder="e.g. INV-2026-001 or Yash Honda - Nov"
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value);
                if (renameError) setRenameError("");
              }}
              maxLength={50}
              disabled={renaming}
              className={renameError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {renameError ? (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {renameError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                This updates the heading across your invoices list, preview, PDF downloads, and share receipts.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameTarget(null)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renaming || !renameValue.trim()}>
              {renaming ? "Saving…" : "Save name"}
            </Button>
          </div>
        </form>
      </Sheet>

      <Sheet
        open={uploadOpen}
        onClose={() => {
          if (!uploading) setUploadOpen(false);
        }}
        title="Upload older invoice"
        description="Store an existing invoice PDF or image in your local records for future reference."
      >
        <form onSubmit={(e) => void handleUploadSubmit(e)} className="space-y-4">
          <div>
            <Label htmlFor="upload-invoice-file">Invoice file (PDF or Image) *</Label>
            <label
              htmlFor="upload-invoice-file"
              className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-5 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40 dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-brand-500"
            >
              <Upload className="mb-1.5 h-5 w-5 text-stone-400" aria-hidden="true" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                {uploadFile ? uploadFile.fileName : "Choose a PDF or image file"}
              </span>
              <span className="mt-0.5 text-xs text-stone-400">
                {uploadFile
                  ? `${(uploadFile.fileSize / 1024).toFixed(0)} KB · Click to change`
                  : "PDF, PNG, JPG or WebP up to 15 MB"}
              </span>
            </label>
            <input
              id="upload-invoice-file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePickUploadFile}
              disabled={uploading}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="upload-invoice-number">Invoice number *</Label>
              <Input
                id="upload-invoice-number"
                placeholder="e.g. INV-0012"
                value={uploadNumber}
                onChange={(e) => setUploadNumber(e.target.value)}
                maxLength={50}
                disabled={uploading}
                required
              />
            </div>
            <div>
              <Label htmlFor="upload-invoice-date">Invoice date</Label>
              <Input
                id="upload-invoice-date"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="upload-customer-name">Customer name *</Label>
              <Input
                id="upload-customer-name"
                placeholder="e.g. Acme Corp"
                value={uploadCustomer}
                onChange={(e) => setUploadCustomer(e.target.value)}
                disabled={uploading}
                required
              />
            </div>
            <div>
              <Label htmlFor="upload-total-amount">Total amount</Label>
              <Input
                id="upload-total-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={uploadTotal}
                onChange={(e) => setUploadTotal(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          <div>
            <Label>Payment status</Label>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadPaid(true)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  uploadPaid
                    ? "border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-200"
                    : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                )}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setUploadPaid(false)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  !uploadPaid
                    ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-200"
                    : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                )}
              >
                Unpaid
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="upload-notes">Notes (optional)</Label>
            <Textarea
              id="upload-notes"
              rows={2}
              placeholder="e.g. Generated in older Invoicer version"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              disabled={uploading}
            />
          </div>

          {uploadError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !uploadFile}>
              {uploading ? "Saving…" : "Save to Records"}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}