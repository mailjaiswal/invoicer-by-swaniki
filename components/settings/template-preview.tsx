"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { InvoiceDocument } from "@/components/invoice/document";
import { Button } from "@/components/common/button";
import { calcInvoiceTotals, taxBreakupFromTotals } from "@/lib/calculations";
import { uid, formatDateInput, cn } from "@/lib/utils";
import { INVOICE_TEMPLATES } from "@/lib/constants";
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
export function demoInvoice(): Invoice {
  const rawItems: Array<
    Omit<InvoiceItem, "id" | "lineTotal">
  > = [
    {
      name: "Yash Honda Attendance Dashboard - Development",
      description: "Custom admin portal, biometrics sync, automated reporting",
      quantity: 1,
      rate: 100000,
      discount: 0,
      taxType: "gst_igst",
      taxRate: 18,
    },
    {
      name: "Additional annual Charges",
      description: "Includes AWS LightSail server and webapp notification charges",
      quantity: 1,
      rate: 17000,
      discount: 0,
      taxType: "gst_igst",
      taxRate: 18,
    },
    {
      name: "WhatsApp charges - Setup and monthly charges",
      description: "Up to 1200 transactional messages per month",
      frequency: "Monthly",
      quantity: 12,
      rate: 800,
      discount: 0,
      taxType: "gst_igst",
      taxRate: 18,
    },
    {
      name: "Attendance dashboard maintenance charges",
      description: "Waived off for the first year",
      frequency: "Monthly",
      quantity: 12,
      rate: 3000,
      discount: 100,
      taxType: "gst_igst",
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
      name: "Yash Honda Motors",
      company: "Yash Automobiles Pvt. Ltd.",
      email: "billing@yashhonda.example",
      phone: "+91 98765 43210",
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
    notes: "Thank you for partnering with us! Bank details & UPI are attached below.",
    terms: "Payment due within 15 days of invoice date. 18% GST applicable as per statutory rates.",
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
  onPreview?: (id: InvoiceTemplateId) => void;
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
  onPreview,
}: TemplatePreviewCardProps) {
  const [frameRef, scale] = useFitScale(PREVIEW_BASE_WIDTH);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (onPreview) {
          onPreview(templateId);
        } else {
          onSelect(templateId);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onPreview) onPreview(templateId);
          else onSelect(templateId);
        }
      }}
      aria-pressed={active}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        active
          ? "border-brand-600 ring-2 ring-brand-600/30 dark:border-brand-500 shadow-sm"
          : "border-stone-200 hover:border-brand-300 dark:border-stone-800 dark:hover:border-stone-700"
      )}
    >
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-stone-100 dark:bg-stone-900"
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

        {/* Hover overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-stone-950/20 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-stone-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
            <Maximize2 className="h-3.5 w-3.5" />
            Click to Preview Large
          </span>
        </div>

        {active && (
          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white dark:ring-stone-900">
            <Check className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Selected</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between border-t border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-stone-900 dark:text-white">
              {label}
            </p>
            {active && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
            {blurb}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface TemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  initialTemplateId: InvoiceTemplateId;
  currentTemplateId: InvoiceTemplateId;
  onSelect: (id: InvoiceTemplateId) => void;
  business?: Business;
  settings?: AppSettings;
  sampleInvoice?: Invoice;
}

/**
 * Large, scrollable full-screen popup modal for previewing and scrolling through
 * templates in full A4 structure with seamless carousel and arrow-key navigation.
 */
export function TemplatePreviewModal({
  open,
  onClose,
  initialTemplateId,
  currentTemplateId,
  onSelect,
  business,
  settings,
  sampleInvoice: customInvoice,
}: TemplatePreviewModalProps) {
  const [activeId, setActiveId] = React.useState<InvoiceTemplateId>(initialTemplateId);
  const activeTabRef = React.useRef<HTMLButtonElement | null>(null);

  // Sync activeId with initialTemplateId when opened
  React.useEffect(() => {
    if (open) {
      setActiveId(initialTemplateId);
    }
  }, [open, initialTemplateId]);

  // Scroll active tab into view when activeId changes
  React.useEffect(() => {
    if (open && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [open, activeId]);

  // Navigate through templates
  const templateList = INVOICE_TEMPLATES;
  const currentIndex = templateList.findIndex((t) => t.id === activeId);
  const activeTemplate = templateList[currentIndex] || templateList[0];

  const goToPrev = React.useCallback(() => {
    const nextIdx = (currentIndex - 1 + templateList.length) % templateList.length;
    setActiveId(templateList[nextIdx].id as InvoiceTemplateId);
  }, [currentIndex, templateList]);

  const goToNext = React.useCallback(() => {
    const nextIdx = (currentIndex + 1) % templateList.length;
    setActiveId(templateList[nextIdx].id as InvoiceTemplateId);
  }, [currentIndex, templateList]);

  const handleApply = React.useCallback(() => {
    onSelect(activeId);
  }, [activeId, onSelect]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Apply if not already on an interactive control
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "button" && tag !== "input" && tag !== "select") {
          e.preventDefault();
          handleApply();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, goToPrev, goToNext, handleApply]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const isCurrent = activeId === currentTemplateId;
  const docInvoice = customInvoice || demoInvoice();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Template Preview and Selection"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[94vh] max-h-[1050px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3.5 sm:px-6 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrev}
                aria-label="Previous template"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                aria-label="Next template"
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-950 sm:text-lg dark:text-white">
                  {activeTemplate.label}
                </h2>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {currentIndex + 1} of {templateList.length}
                </span>
                {isCurrent && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <p className="hidden text-xs text-stone-500 sm:block dark:text-stone-400">
                {activeTemplate.blurb}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCurrent ? (
              <span className="hidden items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" /> Selected
              </span>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                className="gap-1.5 font-semibold shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Use Template</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close preview modal"
              className="h-8 w-8 rounded-lg p-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Templates Navigation Strip */}
        <div className="shrink-0 border-b border-stone-200 bg-stone-50/80 px-4 py-2.5 dark:border-stone-800 dark:bg-stone-950/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {templateList.map((t) => {
              const selected = t.id === activeId;
              const isDefault = t.id === currentTemplateId;
              return (
                <button
                  key={t.id}
                  ref={selected ? activeTabRef : undefined}
                  type="button"
                  onClick={() => setActiveId(t.id as InvoiceTemplateId)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    selected
                      ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/30 font-semibold"
                      : "bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
                  )}
                >
                  <span>{t.label}</span>
                  {isDefault && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        selected ? "bg-white" : "bg-emerald-500"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Large Scrollable Document Preview Viewport */}
        <div className="flex-1 overflow-y-auto bg-stone-100/90 p-4 sm:p-6 md:p-8 dark:bg-stone-950/80">
          <div className="mx-auto w-full max-w-[800px] transition-all">
            <div className="mb-3 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-medium">
                Full-page preview ({activeTemplate.label})
              </span>
              <span className="hidden sm:inline">
                Scroll to inspect items, totals and footer · Press ← / → to switch
              </span>
            </div>

            {/* Complete A4 Document rendered large and crisp */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-900/10">
              <InvoiceDocument
                business={business}
                settings={settings}
                invoice={docInvoice}
                previewNumber="INV-0001"
                template={activeId}
              />
            </div>
          </div>
        </div>

        {/* Modal Bottom Sticky Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-t border-stone-200 bg-white px-4 py-3 sm:px-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              className="gap-1.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous (←)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="gap-1.5 text-xs"
            >
              <span>Next (→)</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {!isCurrent ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                className="gap-1.5 font-semibold"
              >
                <Check className="h-4 w-4" />
                <span>Apply &amp; Select</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="gap-1.5 font-semibold"
              >
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Currently Selected</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
