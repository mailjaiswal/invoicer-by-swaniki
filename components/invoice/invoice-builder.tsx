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
  duplicateInvoiceToDraft,
  getInvoice,
} from "@/lib/db/invoices";
import { listCustomers, listProducts } from "@/lib/db/records";
import { formatInvoiceNumber } from "@/lib/invoice-numbering";
import {
  calcInvoiceTotals,
  taxBreakupFromTotals,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
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
import { CustomerSection } from "./customer-section";
import { ItemsEditor } from "./items-editor";
import { BuilderTotals } from "./builder-totals";
import {
  clearDraft,
  draftKeyFor,
  emptyDraft,
  loadDraft,
  stateFromInvoice,
  type BuilderState,
} from "./builder-utils";
import type { InvoiceDraft, InvoiceItem } from "@/lib/types";

interface InvoiceBuilderProps {
  mode: "quick" | "standard";
  duplicateId?: string | null;
  editId?: string | null;
}

export function InvoiceBuilder({
  mode,
  duplicateId,
  editId,
}: InvoiceBuilderProps) {
  const router = useRouter();
  const { business, settings } = useApp();
  const currency = useAppCurrency();
  const { showToast } = useToast();

  const customers = useLiveQuery(() => listCustomers(), []) ?? [];
  const products = useLiveQuery(() => listProducts(), []) ?? [];

  const [state, setState] = useState<BuilderState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [savedTick, setSavedTick] = useState(0);
  const [loadedFrom, setLoadedFrom] = useState<
    "draft" | "duplicate" | "edit" | "fresh"
  >("fresh");

  const skipAutosave = Boolean(editId);
  const draftKey = draftKeyFor(mode);

  /* Load initial data once (draft restore, duplicate prefill, or edit). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const appSettings = (await getSettings()) ?? undefined;
      if (cancelled) return;

      if (editId) {
        const record = await getInvoice(editId);
        if (cancelled) return;
        if (record) {
          setState(stateFromInvoice(record, appSettings, { freshDates: false }));
          setLoadedFrom("edit");
        } else {
          setState(emptyDraft(appSettings));
          setLoadedFrom("fresh");
          showToast("Couldn't load that invoice.", "error");
        }
        return;
      }

      if (duplicateId) {
        try {
          const draft = await duplicateInvoiceToDraft(duplicateId);
          if (cancelled) return;
          setState(stateFromInvoice(draft, appSettings, { freshDates: true }));
          setLoadedFrom("duplicate");
        } catch {
          if (cancelled) return;
          setState(emptyDraft(appSettings));
          setLoadedFrom("fresh");
          showToast("Couldn't duplicate that invoice.", "error");
        }
        return;
      }

      const restored = loadDraft(draftKey, appSettings);
      if (restored) {
        setState(restored);
        setLoadedFrom("draft");
        showToast("Restored your draft.", "info");
      } else {
        setState(emptyDraft(appSettings));
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
    return calcInvoiceTotals(state?.items ?? []);
  }, [state?.items]);

  const previewNumber = useMemo(() => {
    if (state?.invoiceNumber.trim()) return state.invoiceNumber.trim();
    return formatInvoiceNumber(
      settings?.invoicePrefix,
      settings?.nextInvoiceNumber ?? 1,
      settings?.invoiceNumberPadding ?? 4
    );
  }, [state, settings]);

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
    const kept = state.items.filter(hasContent);
    if (kept.length === 0) {
      return "Add at least one item with a name and quantity.";
    }
    const named = state.items.filter((item) => item.name.trim().length > 0);
    for (const item of named) {
      if (item.quantity <= 0) {
        return `Quantity must be more than zero for “${item.name}”.`;
      }
      if (item.rate < 0) return `Rate can’t be negative for “${item.name}”.`;
    }
    if (!state.invoiceDate) return "Choose an invoice date.";
    return null;
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
      const kept = state.items.filter(hasContent);
      const keptCalc = calcInvoiceTotals(kept);
      const items: InvoiceItem[] = kept.map((line, index) => ({
        id: line.id,
        productId: line.productId,
        name: line.name.trim(),
        description: line.description?.trim() || undefined,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        discount: line.discount,
        taxType: line.taxType,
        taxRate: line.taxRate,
        lineTotal: keptCalc.lines[index].lineTotal,
      }));

      const draft: InvoiceDraft = {
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
        dueDate: state.dueDate || null,
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

      clearDraft(draftKey);
      router.replace(`/invoice/view?id=${invoice.id}`);
      showToast(`Invoice ${invoice.invoiceNumber} is ready.`);
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
      <header className="flex items-center gap-3">
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
            {mode === "quick" ? "Quick Invoice" : "New Invoice"}
          </h1>
          <p className="truncate text-sm text-stone-500 dark:text-stone-400">
            Number: <span className="font-medium text-stone-700 dark:text-stone-300">{previewNumber}</span>
            {loadedFrom === "draft" && " · draft restored"}
            {loadedFrom === "duplicate" && " · duplication"}
            {loadedFrom === "edit" && " · editing a copy"}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 sm:flex">
          {savedTick > 0 && !skipAutosave && (
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
            items={state.items}
            products={products}
            currency={currency}
            onChange={(items) => patch({ items })}
          />

          <Card>
            <CardHeader>
              <CardTitle>Invoice details</CardTitle>
              <CardDescription>
                Dates, number and payment terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoice-number">
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                    Invoice number (optional)
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
                      Issue date
                    </span>
                  </Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={state.invoiceDate}
                    onChange={(e) => patch({ invoiceDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="due-date">Due date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={state.dueDate}
                    onChange={(e) => patch({ dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-notes">
                  <span className="inline-flex items-center gap-1.5">
                    <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                    Notes
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
                <Label htmlFor="invoice-terms">Terms</Label>
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
            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-5 w-5" aria-hidden="true" />
              )}
              {saving ? "Creating…" : "Generate invoice"}
            </Button>
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
          <InvoiceDocument
            business={business}
            settings={settings}
            invoice={{
              invoiceNumber: "",
              customerSnapshot: {
                name: state.customer.name.trim() || "Customer",
                company: state.customer.company,
                email: state.customer.email,
                phone: state.customer.phone,
              },
              items: state.items.map(
                (line, index): InvoiceItem => ({
                  id: line.id,
                  productId: line.productId,
                  name: line.name.trim() || "Untitled item",
                  description:
                    line.description?.trim() || undefined,
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
              dueDate: state.dueDate || null,
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
          <div className="hidden lg:block">
            {formError && (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-5 w-5" aria-hidden="true" />
              )}
              {saving ? "Creating…" : "Generate invoice"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}