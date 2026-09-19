"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { InvoiceDocument } from "@/components/invoice/document";
import { calcInvoiceTotals, taxBreakupFromTotals } from "@/lib/calculations";
import { uid, formatDateInput, cn } from "@/lib/utils";
import type {
  AppSettings,
  Business,
  Invoice,
  InvoiceItem,
  InvoiceTemplateId,
} from "@/lib/types";

/** Fixed render width of the preview document; scaled down to fit its card. */
const PREVIEW_BASE_WIDTH = 960;

/** A compact demo invoice shared by every template preview. */
function demoInvoice(): Invoice {
  const rawItems: Array<
    Omit<InvoiceItem, "id" | "lineTotal">
  > = [
    {
      name: "Website design",
      description: "Homepage + 4 inner pages",
      quantity: 1,
      unit: "project",
      rate: 24000,
      discount: 0,
      taxType: "gst_igst",
      taxRate: 18,
    },
    {
      name: "Setup & training",
      description: "One-time onboarding",
      quantity: 2,
      unit: "hr",
      rate: 1200,
      discount: 0,
      taxType: "gst_cgst_sgst",
      taxRate: 18,
    },
  ];
  const calc = calcInvoiceTotals(rawItems);
  const items: InvoiceItem[] = rawItems.map((entry, index) => ({
    ...entry,
    id: uid("item"),
    lineTotal: calc.lines[index].lineTotal,
  }));
  const date = formatDateInput(new Date());
  const due = formatDateInput(
    new Date(Date.now() + 15 * 86_400_000)
  );
  return {
    id: uid("inv"),
    docType: "invoice",
    invoiceNumber: "INV-0001",
    customerId: null,
    customerSnapshot: {
      name: "Sample Customer",
      company: "Acme Trading Co.",
      email: "billing@acme.example",
    },
    items,
    invoiceDate: date,
    dueDate: due,
    subtotal: calc.totals.subtotal,
    discount: calc.totals.discount,
    taxMode: "gst",
    taxBreakup: taxBreakupFromTotals(calc.totals),
    taxableAmount: calc.totals.taxableAmount,
    taxTotal: calc.totals.taxTotal,
    total: calc.totals.total,
    payment: { status: "unpaid", amountPaid: 0, balance: calc.totals.total },
    notes: "Thank you for your business!",
    terms: "Payment due within 15 days.",
    template: "modern",
    createdAt: 0,
    updatedAt: 0,
    status: "unpaid",
  };
}

/** Scale a fixed-width document down to fit its current card width. */
function useFitScale(baseWidth: number): [
  React.RefObject<HTMLDivElement | null>,
  number,
] {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.offsetWidth / baseWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth]);

  return [ref, scale];
}

interface TemplatePreviewCardProps {
  templateId: InvoiceTemplateId;
  label: string;
  blurb: string;
  active: boolean;
  business?: Business;
  settings?: AppSettings;
  onSelect: (id: InvoiceTemplateId) => void;
}

/** One selectable template card with a live scaled preview of the document. */
export function TemplatePreviewCard({
  templateId,
  label,
  blurb,
  active,
  business,
  settings,
  onSelect,
}: TemplatePreviewCardProps) {
  const [frameRef, scale] = useFitScale(PREVIEW_BASE_WIDTH);

  return (
    <button
      type="button"
      onClick={() => onSelect(templateId)}
      aria-pressed={active}
      className={cn(
        "group overflow-hidden rounded-xl border text-left transition-colors",
        active
          ? "border-brand-600 ring-2 ring-brand-600/30 dark:border-brand-500"
          : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
      )}
    >
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-stone-100"
        style={{ height: 248 }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: PREVIEW_BASE_WIDTH,
            transform: `scale(${scale || 1})`,
            transformOrigin: "top left",
          }}
        >
          <InvoiceDocument
            business={business}
            settings={settings}
            invoice={demoInvoice()}
            previewNumber="INV-0001"
            template={templateId}
          />
        </div>
        {active && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
            <Check className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Selected</span>
          </span>
        )}
      </div>
      <div className="border-t border-stone-200 bg-white px-3 py-2.5 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-semibold text-stone-900 dark:text-white">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {blurb}
        </p>
      </div>
    </button>
  );
}