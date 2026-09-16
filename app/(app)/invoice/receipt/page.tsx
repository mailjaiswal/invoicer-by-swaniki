"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useApp, useToast } from "@/lib/providers";
import { getInvoice } from "@/lib/db/invoices";
import { Button } from "@/components/common/button";
import { EmptyState } from "@/components/common/empty-state";
import { ReceiptDocument } from "@/components/invoice/receipt-document";
import { triggerPrint } from "@/lib/print";
import { generateReceiptPdf } from "@/lib/pdf";

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden="true">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        </div>
      }
    >
      <ReceiptView />
    </Suspense>
  );
}

function ReceiptView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id") ?? "";

  const { business, settings, hydrated } = useApp();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const invoice = useLiveQuery(
    () => (invoiceId ? getInvoice(invoiceId) : Promise.resolve(undefined)),
    [invoiceId]
  );

  const handlePrint = () => {
    if (!triggerPrint()) {
      showToast(
        "We couldn't print the receipt. Try Print → Save as PDF.",
        "error"
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setBusy(true);
    try {
      await generateReceiptPdf(invoice, business, settings);
    } catch {
      showToast(
        "We couldn't generate the PDF. Try Print → Save as PDF.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

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
        title="Receipt not found"
        description="The invoice it belongs to may have been deleted."
        action={
          <Button variant="secondary" onClick={() => router.push("/invoices")}>
            View all invoices
          </Button>
        }
      />
    );
  }

  if (invoice.payment.amountPaid <= 0) {
    return (
      <EmptyState
        title="No payment recorded yet"
        description="Record a payment on this invoice first — the receipt shows what was received."
        action={
          <Button
            variant="secondary"
            onClick={() => router.push(`/invoice/view?id=${invoice.id}`)}
          >
            Back to invoice
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => router.push(`/invoice/view?id=${invoice.id}`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          aria-label="Back to invoice"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            Receipt
          </h1>
          <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">
            {invoice.customerSnapshot.name || "Unknown customer"} · {invoice.invoiceNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleDownloadPdf} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[820px]">
        <ReceiptDocument
          business={business}
          settings={settings}
          invoice={invoice}
        />
      </div>
    </div>
  );
}