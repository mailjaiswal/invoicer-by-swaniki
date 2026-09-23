import { uid, formatDateInput } from "@/lib/utils";
import type {
  AppSettings,
  DocType,
  InvoiceDraft,
  Product,
  TaxType,
} from "@/lib/types";

export interface BuilderLine {
  id: string;
  productId?: string;
  /** When true the line keeps pulling name/description/rate/tax from the linked product. */
  linked?: boolean;
  name: string;
  description?: string;
  comments?: string;
  frequency?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxType: TaxType;
  taxRate: number;
}

/** Common billing cadences offered as frequency suggestions. */
export const FREQUENCY_OPTIONS = [
  "One-time",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Half-yearly",
  "Yearly",
] as const;

export interface BuilderCustomer {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface BuilderState {
  docType: DocType;
  invoiceNumber: string;
  customerId: string | null;
  customer: BuilderCustomer;
  items: BuilderLine[];
  invoiceDate: string;
  /** Invoice-only: payment due date. */
  dueDate: string;
  /** Quotation-only: last date the quoted price is valid. */
  validityDate: string;
  notes: string;
  terms: string;
  saveCustomer: boolean;
}

export const TAX_TYPES: TaxType[] = [
  "none",
  "percentage",
  "gst_igst",
  "gst_cgst_sgst",
];

export function isTaxType(value: unknown): value is TaxType {
  return (
    typeof value === "string" &&
    (TAX_TYPES as string[]).includes(value)
  );
}

export function defaultLineTax(
  settings?: AppSettings | null
): { taxType: TaxType; taxRate: number } {
  if (settings?.taxMode === "single" || settings?.taxMode === "custom") {
    return { taxType: "percentage", taxRate: settings.defaultTax ?? 0 };
  }
  if (settings?.taxMode === "gst") {
    return { taxType: "gst_cgst_sgst", taxRate: settings.defaultTax ?? 18 };
  }
  return { taxType: "none", taxRate: 0 };
}

export function blankLine(
  settings?: AppSettings | null,
  quantity = 1
): BuilderLine {
  const { taxType, taxRate } = defaultLineTax(settings);
  return {
    id: uid("item"),
    name: "",
    quantity,
    rate: 0,
    discount: 0,
    taxType,
    taxRate,
    frequency: "",
  };
}

/** Build a new line directly from a saved product (keeps a live link). */
export function lineFromProduct(product: Product): BuilderLine {
  return {
    id: uid("item"),
    productId: product.id,
    linked: true,
    name: product.name,
    description: product.description,
    quantity: 1,
    rate: product.rate,
    frequency: product.frequency ?? "",
    discount: 0,
    taxType: product.taxRate ? "percentage" : "none",
    taxRate: product.taxRate ?? 0,
  };
}

/**
 * Re-apply a linked line's shared fields from the current product so invoices
 * being generated automatically track catalogue edits. Manual overrides (qty,
 * discount, comments) and anything user-typed after linking are preserved
 * unless the product no longer exists.
 */
export function syncLineFromProduct(
  line: BuilderLine,
  product?: Product | null
): BuilderLine {
  if (!line.linked || !line.productId || !product) return line;
  if (product.id !== line.productId) return line;
  return {
    ...line,
    name: product.name,
    description: product.description,
    rate: product.rate,
    frequency: product.frequency?.trim() ? product.frequency : line.frequency,
    taxType: product.taxRate ? ("percentage" as const) : ("none" as const),
    taxRate: product.taxRate ?? 0,
  };
}

export function emptyDraft(
  settings?: AppSettings | null,
  type: DocType = "invoice"
): BuilderState {
  const days = settings?.defaultPaymentTermsDays ?? 0;
  const today = formatDateInput(new Date());
  const due = formatDateInput(new Date(Date.now() + days * 86_400_000));
  return {
    docType: type,
    invoiceNumber: "",
    customerId: null,
    customer: { name: "", company: "", email: "", phone: "" },
    items: [blankLine(settings, 1)],
    invoiceDate: today,
    dueDate: type === "quotation" ? "" : due,
    validityDate: type === "quotation" ? due : "",
    notes: settings?.defaultNotes ?? "",
    terms: settings?.defaultTerms ?? "",
    saveCustomer: true,
  };
}

export function stateFromInvoice(
  draft: InvoiceDraft,
  settings?: AppSettings | null,
  opts: { freshDates?: boolean } = { freshDates: false }
): BuilderState {
  const days = settings?.defaultPaymentTermsDays ?? 0;
  const freshDates = opts.freshDates !== false;
  const docType: DocType = draft.docType === "quotation" ? "quotation" : "invoice";
  return {
    docType,
    invoiceNumber: "",
    customerId: draft.customerId ?? null,
    customer: {
      name: draft.customerSnapshot.name ?? "",
      company: draft.customerSnapshot.company ?? "",
      email: draft.customerSnapshot.email ?? "",
      phone: draft.customerSnapshot.phone ?? "",
    },
    items: draft.items.map((item) => ({
      id: uid("item"),
      productId: item.productId,
      linked: !!item.productId,
      name: item.name,
      description: item.description,
      comments: item.comments,
      frequency: item.frequency,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount,
      taxType: item.taxType,
      taxRate: item.taxRate,
    })),
    invoiceDate: freshDates
      ? formatDateInput(new Date())
      : draft.invoiceDate,
    dueDate: docType === "quotation"
      ? ""
      : freshDates
        ? formatDateInput(new Date(Date.now() + days * 86_400_000))
        : draft.dueDate ?? "",
    validityDate: docType === "quotation"
      ? freshDates
        ? formatDateInput(new Date(Date.now() + days * 86_400_000))
        : draft.validityDate ?? ""
      : "",
    notes: draft.notes ?? "",
    terms: draft.terms ?? "",
    saveCustomer: true,
  };
}

export function draftKeyFor(
  mode: "quick" | "standard",
  type: DocType = "invoice"
): string {
  const modeSeg = mode === "quick" ? "quick" : "standard";
  const typeSeg = type === "quotation" ? "quotation" : "invoice";
  return `invoicer:draft:${typeSeg}:${modeSeg}`;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Coerce a previously saved draft into a safe shape (survives schema drift). */
export function normalizeBuilderState(
  raw: unknown,
  settings?: AppSettings | null
): BuilderState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return null;

  const customerRaw =
    r.customer && typeof r.customer === "object"
      ? (r.customer as Record<string, unknown>)
      : {};

  const items = r.items
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      id: str(item.id) || uid("item"),
      productId: str(item.productId) || undefined,
      linked:
        typeof item.linked === "boolean" ? item.linked : undefined,
      name: str(item.name),
      description: str(item.description) || undefined,
      comments: str(item.comments) || undefined,
      frequency: str(item.frequency) || undefined,
      quantity: num(item.quantity) || 1,
      rate: num(item.rate),
      discount: num(item.discount),
      taxType: isTaxType(item.taxType) ? item.taxType : "none",
      taxRate: num(item.taxRate),
    }));

  return {
    docType: r.docType === "quotation" ? ("quotation" as const) : ("invoice" as const),
    invoiceNumber: str(r.invoiceNumber),
    customerId: str(r.customerId) || null,
    customer: {
      name: str(customerRaw.name),
      company: str(customerRaw.company) || undefined,
      email: str(customerRaw.email) || undefined,
      phone: str(customerRaw.phone) || undefined,
    },
    items: items.length > 0 ? items : [blankLine(settings, 1)],
    invoiceDate: str(r.invoiceDate),
    dueDate: str(r.dueDate),
    validityDate: str(r.validityDate),
    notes: str(r.notes),
    terms: str(r.terms),
    saveCustomer: typeof r.saveCustomer === "boolean" ? r.saveCustomer : true,
  };
}

export function loadDraft(
  key: string,
  settings?: AppSettings | null
): BuilderState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return normalizeBuilderState(JSON.parse(raw), settings);
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — ignore */
  }
}