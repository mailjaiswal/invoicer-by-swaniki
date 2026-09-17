"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Copy,
  Download,
  FilePlus2,
  Loader2,
  MessageCircle,
  Printer,
  QrCode,
  Share2,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useApp, useAppCurrency, useToast } from "@/lib/providers";
import {
  deleteInvoice,
  getInvoice,
  markInvoicePaid,
  recordPayment,
  setInvoiceCustomer,
} from "@/lib/db/invoices";
import { upsertCustomer } from "@/lib/db/records";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { formatDateInput } from "@/lib/utils";
import { formatMoney, formatDate } from "@/lib/formatting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Select } from "@/components/common/select";
import { Sheet } from "@/components/common/sheet";
import { EmptyState } from "@/components/common/empty-state";
import { InvoiceDocument } from "@/components/invoice/document";
import { StatusBadge } from "@/components/invoice/status-badge";
import { triggerPrint } from "@/lib/print";
import { generateInvoicePdf, renderInvoicePdfFile } from "@/lib/pdf";
import {
  buildInvoiceMessage,
  canNativeShare,
  shareNative,
} from "@/lib/share";
import { buildUpiUrl, isValidUpiId } from "@/lib/upi";
import { MessageSheet } from "@/components/invoice/message-sheet";
import { UpiQr } from "@/components/invoice/upi-qr";
import type { PaymentMethod } from "@/lib/types";

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export default function InvoiceViewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden="true">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        </div>
      }
    >
      <InvoiceView />
    </Suspense>
  );
}

function InvoiceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id") ?? "";

  const { business, settings, hydrated } = useApp();
  const currency = useAppCurrency();
  const { showToast } = useToast();

  const invoice = useLiveQuery(
    () => (invoiceId ? getInvoice(invoiceId) : Promise.resolve(undefined)),
    [invoiceId]
  );

  const [paySheetOpen, setPaySheetOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(formatDateInput(new Date()));
  const [payMethod, setPayMethod] = useState<PaymentMethod>("upi");
  const [payReference, setPayReference] = useState("");
  const [payNote, setPayNote] = useState("");
  const [busy, setBusy] = useState<
    "mark" | "record" | "delete" | "save" | "pdf" | "share" | null
  >(null);
  const [composerMode, setComposerMode] = useState<"invoice" | "reminder">(
    () => (searchParams.get("reminder") === "1" ? "reminder" : "invoice")
  );
  const [composerOpen, setComposerOpen] = useState(
    () => searchParams.get("reminder") === "1"
  );
  const [qrSheetOpen, setQrSheetOpen] = useState(false);

  const status = useMemo(
    () => (invoice ? deriveInvoiceStatus(invoice) : undefined),
    [invoice]
  );

  const upiQrValue = useMemo(
    () =>
      invoice && business?.upiId?.trim() && isValidUpiId(business.upiId)
        ? buildUpiUrl({
            id: business.upiId.trim(),
            name: business.name,
            amount: invoice.total,
            note: invoice.invoiceNumber
              ? `Invoice ${invoice.invoiceNumber}`
              : undefined,
          })
        : "",
    [invoice, business]
  );

  const upiEnabled = upiQrValue !== "";

  if (!hydrated) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="It may have been deleted from this device."
        action={
          <Button variant="secondary" onClick={() => router.push("/invoices")}>
            View all invoices
          </Button>
        }
      />
    );
  }

  const money = (amount: number) => formatMoney(amount, currency);

  const openPaySheet = () => {
    setPayAmount(String(invoice.payment.balance || 0));
    setPayDate(formatDateInput(new Date()));
    setPayMethod("upi");
    setPayReference("");
    setPayNote("");
    setPaySheetOpen(true);
  };

  const handleMarkPaid = async () => {
    setBusy("mark");
    try {
      await markInvoicePaid(invoice.id);
      showToast(`${invoice.invoiceNumber} marked as paid.`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Couldn't update payment.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const handleRecordPayment = async () => {
    const amount = Number.parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter an amount greater than zero.", "error");
      return;
    }
    if (amount > invoice.payment.balance) {
      showToast(
        `That's more than the balance due (${money(invoice.payment.balance)}).`,
        "error"
      );
      return;
    }
    setBusy("record");
    try {
      await recordPayment(invoice.id, {
        amount,
        date: payDate,
        method: payMethod,
        reference: payReference.trim() || undefined,
        note: payNote.trim() || undefined,
      });
      setPaySheetOpen(false);
      showToast(`Payment of ${money(amount)} recorded.`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Couldn't record payment.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    try {
      await deleteInvoice(invoice.id);
      setConfirmDeleteOpen(false);
      showToast(`${invoice.invoiceNumber} deleted.`);
      router.replace("/invoices");
    } catch {
      showToast("Couldn't delete the invoice.", "error");
      setBusy(null);
    }
  };

  const handleSaveCustomer = async () => {
    setBusy("save");
    try {
      const { name, company, email, phone } = invoice.customerSnapshot;
      const customer = await upsertCustomer({
        name: name || "Customer",
        company,
        email,
        phone,
      });
      await setInvoiceCustomer(invoice.id, customer.id);
      showToast("Customer saved to your list.");
    } catch {
      showToast("Couldn't save the customer.", "error");
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    if (!triggerPrint()) {
      showToast(
        "We couldn't generate the PDF. Try Print → Save as PDF.",
        "error"
      );
    }
  };

  const handleDownloadPdf = async () => {
    setBusy("pdf");
    try {
      await generateInvoicePdf(invoice, business, settings);
    } catch {
      showToast(
        "We couldn't generate the PDF. Try Print → Save as PDF.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const canMarkPaid =
    status === "unpaid" || status === "partial" || status === "overdue";

  const openComposer = (mode: "invoice" | "reminder") => {
    setComposerMode(mode);
    setComposerOpen(true);
  };

  const handleShare = async () => {
    if (busy === "share") return;
    if (!canNativeShare()) {
      openComposer("invoice");
      return;
    }
    setBusy("share");
    try {
      const { blob, name } = await renderInvoicePdfFile(
        invoice,
        business,
        settings
      );
      const file = new File([blob], name, { type: "application/pdf" });
      const message = buildInvoiceMessage("short", {
        customerName: invoice.customerSnapshot.name?.trim() || "there",
        invoiceNumber: invoice.invoiceNumber,
        amount: money(invoice.total),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : undefined,
        businessName: business?.name,
      });
      const shared = await shareNative({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: message,
        file,
      });
      if (!shared) {
        showToast("Sharing was cancelled.", "error");
      }
    } catch {
      showToast(
        "We couldn't generate the PDF for sharing. Try WhatsApp instead.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => router.push("/invoices")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          aria-label="Back to invoices"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
              {invoice.invoiceNumber}
            </h1>
            {status && <StatusBadge status={status} />}
          </div>
          <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">
            {invoice.customerSnapshot.name || "Unknown customer"} · Issued{" "}
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/invoice/new?duplicate=${invoice.id}`)}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </header>

      {!invoice.customerId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-900/30 print:hidden">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            This customer isn’t saved yet. Add them to your list for faster
            invoices next time.
          </p>
          <Button
            size="sm"
            onClick={handleSaveCustomer}
            disabled={busy === "save"}
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserCheck className="h-4 w-4" aria-hidden="true" />
            )}
            Save customer
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <InvoiceDocument
          business={business}
          settings={settings}
          invoice={invoice}
          status={status}
        />

        <aside className="space-y-4 lg:sticky lg:top-4 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Balance due
                </p>
                <p className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
                  {money(invoice.payment.balance)}
                </p>
                <div className="mt-3 space-y-1 text-xs text-stone-500 dark:text-stone-400">
                  <p className="flex justify-between">
                    <span>Total</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {money(invoice.total)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Paid</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {money(invoice.payment.amountPaid)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Due</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={openPaySheet} disabled={!canMarkPaid}>
                  Record payment
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleMarkPaid}
                  disabled={!canMarkPaid || busy === "mark"}
                >
                  {busy === "mark" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  Mark as paid
                </Button>
              </div>
            </CardContent>
          </Card>

          {(invoice.notes?.trim() || invoice.terms?.trim()) && (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm">
                {!!invoice.notes?.trim() && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-line text-stone-600 dark:text-stone-300">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {!!invoice.terms?.trim() && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Terms
                    </p>
                    <p className="mt-1 whitespace-pre-line text-stone-600 dark:text-stone-300">
                      {invoice.terms}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                Share &amp; Get Paid
              </CardTitle>
              <CardDescription>
                Send a prefilled message, share the PDF, or let them pay you via
                UPI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={handleShare}
                disabled={busy === "share"}
              >
                {busy === "share" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                )}
                Share
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => openComposer("invoice")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => openComposer("reminder")}
                disabled={invoice.payment.balance <= 0}
              >
                <BellRing className="h-4 w-4" aria-hidden="true" />
                Send reminder
              </Button>
              {upiEnabled && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setQrSheetOpen(true)}
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Payment QR
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                Documents
              </CardTitle>
              <CardDescription>
                Download a real PDF, or print a pixel-perfect copy from your
                browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={handleDownloadPdf}
                disabled={busy === "pdf"}
              >
                {busy === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print
              </Button>
              {invoice.payment.amountPaid > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/invoice/receipt?id=${invoice.id}`)}
                >
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Generate receipt
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/invoice/new?duplicate=${invoice.id}`)}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Create a copy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/invoice/new?edit=${invoice.id}`)}
              >
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                {status === "draft" ? "Resume editing" : "Edit as new invoice"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Sheet
        open={paySheetOpen}
        onClose={() => setPaySheetOpen(false)}
        title="Record payment"
        description={`${invoice.invoiceNumber} · balance due ${money(invoice.payment.balance)}`}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pay-date">Date</Label>
              <Input
                id="pay-date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pay-method">Method</Label>
              <Select
                id="pay-method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="pay-reference">
              Reference{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="pay-reference"
              placeholder="UTR / transaction ID"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pay-note">
              Note{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="pay-note"
              placeholder="Received via UPI"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleRecordPayment}
            disabled={busy === "record"}
          >
            {busy === "record" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            Save payment
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this invoice?"
        description="This deletes the invoice and its payment records from this device. This can't be undone."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">{invoice.invoiceNumber}</p>
            <p className="mt-0.5 text-xs opacity-80">
              {invoice.customerSnapshot.name} · {money(invoice.total)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </Sheet>

      <MessageSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        mode={composerMode}
        invoice={invoice}
        business={business}
        settings={settings}
      />

      <Sheet
        open={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        title="Pay via UPI"
        description={`Scan to pay ${money(invoice.total)} for ${invoice.invoiceNumber}`}
      >
        <div className="flex flex-col items-center gap-3">
          <UpiQr value={upiQrValue} size={184} label={business?.upiId} />
          <p className="text-center text-xs text-stone-400 dark:text-stone-500">
            Scan with any UPI app. Payment success isn&apos;t verified
            automatically — record the payment here once it arrives.
          </p>
          <a
            href={upiQrValue}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Open UPI app
          </a>
        </div>
      </Sheet>
    </div>
  );
}