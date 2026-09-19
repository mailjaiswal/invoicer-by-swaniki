"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  CalendarDays,
  Hash,
  Loader2,
  NotebookPen,
  Save,
  FileText,
} from "lucide-react";
import { useApp, useAppCurrency, useToast } from "@/lib/providers";
import { getSettings } from "@/lib/db/database";
import {
  createInvoice,
  deleteInvoice,
  duplicateInvoiceToDraft,
  getInvoice,
  saveInvoiceDraft,
} from "@/lib/db/invoices";
import { listCustomers, listProducts } from "@/lib/db/records";
import { formatInvoiceNumber } from "@/lib/invoice-numbering";
import {
  calcInvoiceTotals,
  taxBreakupFromTotals,
} from "@/lib/calculations";
import { formatDate } from "@/lib/formatting";
import { cn, formatDateInput } from "@/lib/utils";
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
import { Textarea } from "@/components/common/textarea";
import { SegmentedControl } from "@/components/common/segmented";
import { InvoiceDocument } from "./document";
import { FullPagePreview } from "./page-frame";
import { CustomerSection } from "./customer-section";
import { ItemsEditor } from "./items-editor";
import { BuilderTotals } from "./builder-totals";
import {
  clearDraft,
  draftKeyFor,
  emptyDraft,
  loadDraft,
  stateFromInvoice,
  syncLineFromProduct,
  type BuilderState,
} from "./builder-utils";
import type { DocType, InvoiceDraft, InvoiceItem } from "@/lib/types";

interface InvoiceBuilderProps {
  mode: "quick" | "standard";
  docType?: DocType;
  duplicateId?: string | null;
  editId?: string | null;
}

export function InvoiceBuilder({
  mode,
  docType = "invoice",
  duplicateId,
  editId,
}: InvoiceBuilderProps) {
  const router = useRouter();
  const { business, settings } = useApp();
  const currency = useAppCurrency();
  const { showToast } = useToast();
  const isQuotation = docType === "quotation";
  useEffect(() => {
    document.body.dataset.doctype = isQuotation ? "quotation" : "invoice";
    return () => {
      delete document.body.dataset.doctype;
    };
  }, [isQuotation]);

  const customers = useLiveQuery(() => listCustomers(), []) ?? [];
  const productsLive = useLiveQuery(() => listProducts(), []);
  const products = useMemo(() => productsLive ?? [], [productsLive]);

  const [state, setState] = useState<BuilderState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formError, setFormError] = useState("");
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [savedTick, setSavedTick] = useState(0);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [resumeDraftId, setResumeDraftId] = useState<string | null>(null);
  const [duePreset, setDuePreset] = useState<"15" | "30" | "custom">("custom");
  const [loadedFrom, setLoadedFrom] = useState<
    "draft" | "duplicate" | "edit" | "fresh"
  >("fresh");

  const skipAutosave = Boolean(editId);
  const draftKey = draftKeyFor(mode, docType);

  /* Load initial data once (draft restore, duplicate prefill, or edit). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const appSettings = (await getSettings()) ?? undefined;
      if (cancelled) return;

      const presetFromDates = (invoiceDate: string, dateA: string, dateB: string) => {
        const target = isQuotation ? dateA : dateB;
        if (!invoiceDate || !target) return "custom";
        const diff = Math.round(
          (new Date(`${target}T00:00:00`).getTime() -
            new Date(`${invoiceDate}T00:00:00`).getTime()) /
            86_400_000
        );
        if (diff === 15) return "15" as const;
        if (diff === 30) return "30" as const;
        return "custom" as const;
      };

      if (editId) {
        const record = await getInvoice(editId);
        if (cancelled) return;
        if (record) {
          const next = stateFromInvoice(record, appSettings, {
            freshDates: false,
          });
          setState(next);
          setDuePreset(
            presetFromDates(
              next.invoiceDate,
              next.validityDate,
              next.dueDate
            )
          );
          setLoadedFrom("edit");
          if (record.status === "draft") {
            setResumeDraftId(record.id);
            setSavedDraftId(record.id);
          }
        } else {
          const next = emptyDraft(appSettings, docType);
          setState(next);
          setDuePreset(
            presetFromDates(
              next.invoiceDate,
              next.validityDate,
              next.dueDate
            )
          );
          setLoadedFrom("fresh");
          showToast("Couldn't load that invoice.", "error");
        }
        return;
      }

      if (duplicateId) {
        try {
          const draft = await duplicateInvoiceToDraft(duplicateId, docType);
          if (cancelled) return;
          const next = stateFromInvoice(draft, appSettings, {
            freshDates: true,
          });
          setState(next);
          setDuePreset(
            presetFromDates(
              next.invoiceDate,
              next.validityDate,
              next.dueDate
            )
          );
          setLoadedFrom("duplicate");
        } catch {
          if (cancelled) return;
          const next = emptyDraft(appSettings, docType);
          setState(next);
          setDuePreset(
            presetFromDates(
              next.invoiceDate,
              next.validityDate,
              next.dueDate
            )
          );
          setLoadedFrom("fresh");
          showToast("Couldn't duplicate that invoice.", "error");
        }
        return;
      }

      const restored = loadDraft(draftKey, appSettings);
      if (restored) {
        setState(restored);
        setDuePreset(
          presetFromDates(
            restored.invoiceDate,
            restored.validityDate,
            restored.dueDate
          )
        );
        setLoadedFrom("draft");
        showToast("Restored your draft.", "info");
      } else {
        const next = emptyDraft(appSettings, docType);
        setState(next);
        setDuePreset(
          presetFromDates(
            next.invoiceDate,
            next.validityDate,
            next.dueDate
          )
        );
        setLoadedFrom("fresh");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Autosave the working draft (new and duplicate builders only). */
  useEffect(() => {
    if (!state || skipAutosave) return;
    if (state.items.every((item) => item.name.trim() === "")) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(state));
      } catch {
        /* storage unavailable */
      }
      setSavedTick((tick) => tick + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [state, draftKey, skipAutosave]);

  /* Warn before leaving with an unsaved draft. */
  useEffect(() => {
    if (!state) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state]);

  const calc = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]));
    const liveItems = (state?.items ?? []).map((line) =>
      syncLineFromProduct(line, productById.get(line.productId ?? ""))
    );
    return calcInvoiceTotals(liveItems);
  }, [state?.items, products]);

  const liveItems = useMemo(() => {
    if (!state) return [];
    const productById = new Map(products.map((p) => [p.id, p]));
    return state.items.map((line) =>
      syncLineFromProduct(line, productById.get(line.productId ?? ""))
    );
  }, [state, products]);

  const previewNumber = useMemo(() => {
    if (state?.invoiceNumber.trim()) return state.invoiceNumber.trim();
    const prefix = isQuotation
      ? settings?.quotationPrefix || "QOT"
      : settings?.invoicePrefix;
    const next = isQuotation
      ? settings?.nextQuotationNumber ?? 1
      : settings?.nextInvoiceNumber ?? 1;
    return formatInvoiceNumber(prefix, next, settings?.invoiceNumberPadding ?? 4);
  }, [state, settings, isQuotation]);

  if (!state) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  const patch = (patch: Partial<BuilderState>) =>
    setState((current) => (current ? { ...current, ...patch } : current));

  const setCustomer = (customerPatch: Partial<BuilderState["customer"]>) =>
    setState((current) =>
      current
        ? { ...current, customer: { ...current.customer, ...customerPatch } }
        : current
    );

  const selectExistingCustomer = (customer: { id: string; name: string; company?: string; email?: string; phone?: string } | null) =>
    setState((current) =>
      current
        ? {
            ...current,
            customerId: customer?.id ?? null,
            customer: customer
              ? {
                  name: customer.name,
                  company: customer.company,
                  email: customer.email,
                  phone: customer.phone,
                }
              : current.customer,
          }
        : current
    );

  const hasContent = (item: BuilderState["items"][number]) =>
    item.name.trim().length > 0 && item.quantity > 0;

  const validate = (): string | null => {
    if (!state.customer.name.trim()) return "Add a customer name.";
    const kept = liveItems.filter(hasContent);
    if (kept.length === 0) {
      return "Add at least one item with a name and quantity.";
    }
    const named = liveItems.filter((item) => item.name.trim().length > 0);
    for (const item of named) {
      if (item.quantity <= 0) {
        return `Quantity must be more than zero for “${item.name}”.`;
      }
      if (item.rate < 0) return `Rate can’t be negative for “${item.name}”.`;
    }
    if (!state.invoiceDate) return "Choose an invoice date.";
    return null;
  };

  const buildDraft = () => {
    const kept = liveItems.filter(hasContent);
    const keptCalc = calcInvoiceTotals(kept);
    const items: InvoiceItem[] = kept.map((line, index) => ({
      id: line.id,
      productId: line.productId,
      name: line.name.trim(),
      description: line.description?.trim() || undefined,
      comments: line.comments?.trim() || undefined,
      frequency: line.frequency?.trim() || undefined,
      quantity: line.quantity,
      unit: line.unit,
      rate: line.rate,
      discount: line.discount,
      taxType: line.taxType,
      taxRate: line.taxRate,
      lineTotal: keptCalc.lines[index].lineTotal,
    }));

    const draft: InvoiceDraft = {
      docType: isQuotation ? "quotation" : "invoice",
      invoiceNumber: state.invoiceNumber.trim(),
      customerId: state.customerId,
      customerSnapshot: {
        name: state.customer.name.trim(),
        company: state.customer.company?.trim() || undefined,
        email: state.customer.email?.trim() || undefined,
        phone: state.customer.phone?.trim() || undefined,
      },
      items,
      invoiceDate: state.invoiceDate,
      dueDate: isQuotation ? null : state.dueDate || null,
      validityDate: isQuotation ? state.validityDate || null : null,
      subtotal: keptCalc.totals.subtotal,
      discount: keptCalc.totals.discount,
      taxMode: settings?.taxMode ?? "none",
      taxBreakup: taxBreakupFromTotals(keptCalc.totals),
      taxableAmount: keptCalc.totals.taxableAmount,
      taxTotal: keptCalc.totals.taxTotal,
      total: keptCalc.totals.total,
      payment: {
        status: "unpaid",
        amountPaid: 0,
        balance: keptCalc.totals.total,
      },
      notes: state.notes.trim() || undefined,
      terms: state.terms.trim() || undefined,
      template: settings?.defaultTemplate ?? "modern",
    };
    return draft;
  };

  const handleSaveDraft = async () => {
    if (!state) return;
    if (
      !state.customer.name.trim() &&
      state.items.every((item) => item.name.trim() === "")
    ) {
      setFormError("Add a customer name or an item before saving a draft.");
      showToast("Add a customer name or an item first.", "error");
      return;
    }
    setSavingDraft(true);
    try {
      const draft = buildDraft();
      const invoice = await saveInvoiceDraft(
        draft,
        {
          manualNumber: state.invoiceNumber.trim() || undefined,
          customerId: state.customerId,
        },
        savedDraftId ?? undefined
      );
      setSavedDraftId(invoice.id);
      setResumeDraftId(invoice.id);
      setFormError("");
      showToast("Draft saved — you can resume editing it later.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't save the draft.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSavingDraft(false);
    }
  };

  const setDueRelative = (days: number) => {
    const base = state.invoiceDate
      ? new Date(`${state.invoiceDate}T00:00:00`)
      : new Date();
    const next = new Date(base.getTime() + days * 86_400_000);
    if (isQuotation) patch({ validityDate: formatDateInput(next) });
    else patch({ dueDate: formatDateInput(next) });
  };

  const pickDuePreset = (value: "15" | "30" | "custom") => {
    setDuePreset(value);
    if (value !== "custom") setDueRelative(Number(value));
  };

  const handleInvoiceDateChange = (value: string) => {
    patch({ invoiceDate: value });
    if (duePreset !== "custom" && value) setDueRelative(Number(duePreset));
  };

  const handleGenerate = async () => {
    if (!state) return;
    const error = validate();
    if (error) {
      setFormError(error);
      showToast(error, "error");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const draft = buildDraft();

      const invoice = await createInvoice(draft, {
        manualNumber: state.invoiceNumber.trim() || undefined,
        customerId: state.customerId,
        saveCustomer:
          state.saveCustomer && !state.customerId
            ? {
                name: draft.customerSnapshot.name!,
                company: draft.customerSnapshot.company,
                email: draft.customerSnapshot.email,
                phone: draft.customerSnapshot.phone,
              }
            : undefined,
      });

      if (resumeDraftId) await deleteInvoice(resumeDraftId);
      clearDraft(draftKey);
      router.replace(`/invoice/view?id=${invoice.id}`);
      showToast(
        `${isQuotation ? "Quotation" : "Invoice"} ${invoice.invoiceNumber} is ready.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't create the invoice.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header
        className={cn(
          "flex items-center gap-3 border-b-2 pb-3",
          isQuotation
            ? "border-emerald-200 dark:border-emerald-800"
            : "border-violet-200 dark:border-violet-800"
        )}
      >
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            {mode === "quick" && !isQuotation
              ? "Quick Invoice"
              : isQuotation
                ? "New Quotation"
                : "New Invoice"}
          </h1>
          <p className="truncate text-sm text-stone-500 dark:text-stone-400">
            Number: <span className="font-medium text-stone-700 dark:text-stone-300">{previewNumber}</span>
            {loadedFrom === "draft" && " · draft restored"}
            {loadedFrom === "duplicate" && " · duplication"}
            {loadedFrom === "edit" && (resumeDraftId ? " · resuming a draft" : " · editing a copy")}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 sm:flex">
          {savedDraftId && (
            <>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Saved as draft
            </>
          )}
          {savedTick > 0 && !skipAutosave && !savedDraftId && (
            <>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Draft auto-saved
            </>
          )}
        </div>
      </header>

      <div className="lg:hidden">
        <SegmentedControl
          aria-label="Builder view"
          value={tab}
          onChange={setTab}
          options={[
            { value: "form" as const, label: "Details" },
            { value: "preview" as const, label: "Preview" },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* Left: form */}
        <section
          className={cn("space-y-6", tab === "preview" && "hidden lg:block")}
        >
          <CustomerSection
            mode={mode}
            customer={state.customer}
            customerId={state.customerId}
            saveCustomer={state.saveCustomer}
            customers={customers}
            onChange={setCustomer}
            onSelectExisting={selectExistingCustomer}
            onSaveToggle={(saved) => patch({ saveCustomer: saved })}
          />

          <ItemsEditor
            mode={mode}
            items={liveItems}
            products={products}
            currency={currency}
            onChange={(items) => patch({ items })}
          />

          <Card>
            <CardHeader>
              <CardTitle>{isQuotation ? "Quotation details" : "Invoice details"}</CardTitle>
              <CardDescription>
                {isQuotation
                  ? "Dates, number and validity."
                  : "Dates, number and payment terms."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoice-number">
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                    {isQuotation ? "Quotation number" : "Invoice number"} (optional)
                  </span>
                </Label>
                <Input
                  id="invoice-number"
                  placeholder={previewNumber}
                  value={state.invoiceNumber}
                  onChange={(e) => patch({ invoiceNumber: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-stone-400">
                  Leave blank to auto-assign the next number.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="invoice-date">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {isQuotation ? "Quotation date" : "Issue date"}
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="invoice-date"
                      type="date"
                      value={state.invoiceDate}
                      onChange={(e) => handleInvoiceDateChange(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Set issue date to today"
                      onClick={() => {
                        const today = formatDateInput(new Date());
                        patch({ invoiceDate: today });
                        if (duePreset !== "custom")
                          setDueRelative(Number(duePreset));
                      }}
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {isQuotation ? "Valid until" : "Due date"}
                    </span>
                  </Label>
                  <SegmentedControl
                    aria-label="Validity preset"
                    value={duePreset}
                    onChange={pickDuePreset}
                    options={[
                      { value: "15" as const, label: "15 days" },
                      { value: "30" as const, label: "30 days" },
                      { value: "custom" as const, label: "Custom" },
                    ]}
                  />
                  {duePreset === "custom" ? (
                    isQuotation ? (
                      <Input
                        type="date"
                        value={state.validityDate}
                        onChange={(e) =>
                          patch({ validityDate: e.target.value })
                        }
                      />
                    ) : (
                      <Input
                        type="date"
                        value={state.dueDate}
                        onChange={(e) => patch({ dueDate: e.target.value })}
                      />
                    )
                  ) : isQuotation ? (
                    state.validityDate ? (
                      <p className="text-xs text-stone-400">
                        Valid until {formatDate(state.validityDate)}
                      </p>
                    ) : null
                  ) : state.dueDate ? (
                    <p className="text-xs text-stone-400">
                      Due {formatDate(state.dueDate)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-notes">
                  <span className="inline-flex items-center gap-1.5">
                    <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                    {settings?.notesLabel || "Notes"}
                  </span>
                </Label>
                <Textarea
                  id="invoice-notes"
                  placeholder="Thank you for your business! Payment is due by the due date."
                  value={state.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="invoice-terms">
                  {settings?.termsLabel || "Terms"}
                </Label>
                <Textarea
                  id="invoice-terms"
                  placeholder="Payment is expected within 15 days of the invoice date."
                  value={state.terms}
                  onChange={(e) => patch({ terms: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="lg:hidden">
            {formError && (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={savingDraft || saving}
              >
                {savingDraft ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-5 w-5" aria-hidden="true" />
                )}
                {savingDraft ? "Saving…" : "Save draft"}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleGenerate}
                disabled={saving || savingDraft}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="h-5 w-5" aria-hidden="true" />
                )}
                {saving ? "Creating…" : isQuotation ? "Generate quotation" : "Generate invoice"}
              </Button>
            </div>
          </div>
        </section>

        {/* Right: preview */}
        <section
          className={cn(
            "space-y-4 lg:sticky lg:top-4",
            tab === "form" && "hidden lg:block"
          )}
        >
          <BuilderTotals calc={calc} currency={currency} />
        <FullPagePreview
          landscape={
            (settings?.pageOrientation ?? "portrait") === "landscape"
          }
        >
            <InvoiceDocument
            business={business}
            settings={settings}
            invoice={{
              docType: isQuotation ? "quotation" : "invoice",
              invoiceNumber: "",
              customerSnapshot: {
                name: state.customer.name.trim() || "Customer",
                company: state.customer.company,
                email: state.customer.email,
                phone: state.customer.phone,
              },
              items: liveItems.map(
                (line, index): InvoiceItem => ({
                  id: line.id,
                  productId: line.productId,
                  name: line.name.trim() || "Untitled item",
                  description:
                    line.description?.trim() || undefined,
                  comments: line.comments?.trim() || undefined,
                  frequency: line.frequency?.trim() || undefined,
                  quantity: line.quantity,
                  unit: line.unit,
                  rate: line.rate,
                  discount: line.discount,
                  taxType: line.taxType,
                  taxRate: line.taxRate,
                  lineTotal: calc.lines[index]?.lineTotal ?? 0,
                })
              ),
              invoiceDate: state.invoiceDate,
              dueDate: isQuotation ? null : state.dueDate || null,
              validityDate: isQuotation ? state.validityDate || null : null,
              subtotal: calc.totals.subtotal,
              discount: calc.totals.discount,
              taxMode: settings?.taxMode ?? "none",
              taxBreakup: taxBreakupFromTotals(calc.totals),
              taxableAmount: calc.totals.taxableAmount,
              taxTotal: calc.totals.taxTotal,
              total: calc.totals.total,
              payment: {
                status: "unpaid",
                amountPaid: 0,
                balance: calc.totals.total,
              },
              notes: state.notes.trim() || undefined,
              terms: state.terms.trim() || undefined,
              template: settings?.defaultTemplate ?? "modern",
            }}
            previewNumber={
              state.invoiceNumber.trim() || previewNumber || "Preview"
            }
          />
          </FullPagePreview>
          <div className="hidden lg:block">
            {formError && (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={savingDraft || saving}
              >
                {savingDraft ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-5 w-5" aria-hidden="true" />
                )}
                {savingDraft ? "Saving…" : "Save draft"}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleGenerate}
                disabled={saving || savingDraft}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="h-5 w-5" aria-hidden="true" />
                )}
                {saving ? "Creating…" : isQuotation ? "Generate quotation" : "Generate invoice"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}