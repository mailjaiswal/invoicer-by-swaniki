import { db, DataError, now } from "./database";
import { upsertCustomer } from "./records";
import { getSettings } from "./database";
import { uid, formatDateInput } from "@/lib/utils";
import {
  calcInvoiceTotals,
  round2,
  taxBreakupFromTotals,
} from "@/lib/calculations";
import {
  formatInvoiceNumber,
  isValidInvoiceNumberFormat,
  parseInvoiceNumberSeed,
} from "@/lib/invoice-numbering";
import type {
  CustomerDraft,
  Invoice,
  InvoiceDraft,
  InvoiceItem,
  Payment,
  PaymentMethod,
} from "@/lib/types";

export interface CreateInvoiceOptions {
  /** A user-typed number that must not already exist. */
  manualNumber?: string;
  customerId?: string | null;
  /** Persist this customer record (quick invoice) and link it. */
  saveCustomer?: CustomerDraft;
}

/**
 * Persist an invoice, assign/reserve its number from settings and recompute
 * totals from the line items as the single source of truth. Runs atomically.
 */
export async function createInvoice(
  draft: InvoiceDraft,
  options: CreateInvoiceOptions = {}
): Promise<Invoice> {
  const kept = draft.items.filter(
    (item) => item.name.trim().length > 0 && item.quantity > 0
  );
  if (kept.length === 0) {
    throw new DataError("Add at least one item with a name and quantity.");
  }
  if (!draft.customerSnapshot.name.trim()) {
    throw new DataError("Add a customer name.");
  }

  return db.transaction(
    "rw",
    [db.settings, db.invoices, db.customers],
    async () => {
      const settings = (await getSettings())!;
      const manualValue = options.manualNumber?.trim();
      let invoiceNumber: string;

      if (manualValue) {
        if (!isValidInvoiceNumberFormat(manualValue)) {
          throw new DataError(
            "That invoice number isn't valid. Use letters, numbers and simple separators."
          );
        }
        const duplicate = await db.invoices
          .where("invoiceNumber")
          .equals(manualValue)
          .first();
        if (duplicate) {
          throw new DataError(
            `Invoice number ${manualValue} is already in use.`
          );
        }
        invoiceNumber = manualValue;
        const seed = parseInvoiceNumberSeed(manualValue);
        if (seed !== null && seed >= settings.nextInvoiceNumber) {
          settings.nextInvoiceNumber = seed + 1;
          settings.updatedAt = now();
          await db.settings.put(settings);
        }
      } else {
        invoiceNumber = formatInvoiceNumber(
          settings.invoicePrefix,
          settings.nextInvoiceNumber,
          settings.invoiceNumberPadding
        );
        settings.nextInvoiceNumber += 1;
        settings.updatedAt = now();
        await db.settings.put(settings);
      }

      const calc = calcInvoiceTotals(kept);
      const items: InvoiceItem[] = kept.map((item, index) => ({
        ...item,
        description: item.description?.trim() || undefined,
        lineTotal: calc.lines[index].lineTotal,
      }));

      let customerId = options.customerId ?? draft.customerId ?? null;
      if (options.saveCustomer) {
        const customer = await upsertCustomer(options.saveCustomer);
        customerId = customer.id;
      }

      const timestamp = now();
      const invoice: Invoice = {
        id: uid("inv"),
        invoiceNumber,
        customerId,
        customerSnapshot: draft.customerSnapshot,
        items,
        invoiceDate: draft.invoiceDate,
        dueDate: draft.dueDate || null,
        subtotal: calc.totals.subtotal,
        discount: calc.totals.discount,
        taxMode: draft.taxMode,
        taxBreakup: taxBreakupFromTotals(calc.totals),
        taxableAmount: calc.totals.taxableAmount,
        taxTotal: calc.totals.taxTotal,
        total: calc.totals.total,
        payment: {
          status: "unpaid",
          amountPaid: 0,
          balance: calc.totals.total,
        },
        notes: draft.notes?.trim() || undefined,
        terms: draft.terms?.trim() || undefined,
        template: draft.template || "modern",
        createdAt: timestamp,
        updatedAt: timestamp,
        status: "unpaid",
      };
      await db.invoices.put(invoice);
      return invoice;
    }
  );
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  return db.invoices.get(id);
}

export interface SaveInvoiceDraftOptions {
  /** A user-typed number to keep on the draft (used verbatim if valid). */
  manualNumber?: string;
  customerId?: string | null;
}

/**
 * Persist a work-in-progress invoice with `status: "draft"`. No number from the
 * business sequence is reserved; the preview number is only a label until the
 * draft is generated. Totals are recomputed from the kept line items.
 */
export async function saveInvoiceDraft(
  draft: InvoiceDraft,
  options: SaveInvoiceDraftOptions = {},
  existingId?: string
): Promise<Invoice> {
  const kept = draft.items.filter(
    (item) => item.name.trim().length > 0 && item.quantity > 0
  );
  const manualValue = options.manualNumber?.trim();
  const calc = calcInvoiceTotals(kept);
  const items: InvoiceItem[] = kept.map((item, index) => ({
    ...item,
    description: item.description?.trim() || undefined,
    comments: item.comments?.trim() || undefined,
    lineTotal: calc.lines[index].lineTotal,
  }));

  const timestamp = now();
  const existing = existingId ? await db.invoices.get(existingId) : undefined;
  const fallbackNumber = existing?.invoiceNumber
    ? existing.invoiceNumber
    : `DRAFT-${formatDateInput(new Date())
        .replaceAll("-", "")
        .slice(4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  let invoiceNumber = fallbackNumber;
  if (manualValue) {
    if (!isValidInvoiceNumberFormat(manualValue)) {
      throw new DataError(
        "That invoice number isn’t valid. Use letters, numbers and simple separators."
      );
    }
    const clash = await db.invoices
      .where("invoiceNumber")
      .equals(manualValue)
      .first();
    if (clash && clash.id !== existingId) {
      throw new DataError(`Invoice number ${manualValue} is already in use.`);
    }
    invoiceNumber = manualValue;
  }

  const draftInvoice: Invoice = {
    id: existingId ?? uid("inv"),
    invoiceNumber,
    customerId: options.customerId ?? draft.customerId ?? null,
    customerSnapshot: draft.customerSnapshot ?? { name: "" },
    items,
    invoiceDate: draft.invoiceDate || formatDateInput(new Date()),
    dueDate: draft.dueDate || null,
    subtotal: calc.totals.subtotal,
    discount: calc.totals.discount,
    taxMode: draft.taxMode,
    taxBreakup: taxBreakupFromTotals(calc.totals),
    taxableAmount: calc.totals.taxableAmount,
    taxTotal: calc.totals.taxTotal,
    total: calc.totals.total,
    payment: {
      status: "unpaid",
      amountPaid: 0,
      balance: calc.totals.total,
    },
    notes: draft.notes?.trim() || undefined,
    terms: draft.terms?.trim() || undefined,
    template: draft.template || "modern",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    status: "draft",
  };
  await db.invoices.put(draftInvoice);
  return draftInvoice;
}

export function listInvoices(): Promise<Invoice[]> {
  return db.invoices.orderBy("createdAt").reverse().toArray();
}

export async function updateInvoiceRecord(
  id: string,
  patch: Partial<Invoice>
): Promise<Invoice | undefined> {
  await db.invoices.update(id, { ...patch, updatedAt: now() });
  return db.invoices.get(id);
}

export async function deleteInvoice(id: string): Promise<void> {
  await db.transaction("rw", [db.invoices, db.payments], async () => {
    await db.invoices.delete(id);
    await db.payments.where("invoiceId").equals(id).delete();
  });
}

export interface RecordPaymentInput {
  amount: number;
  date: string;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
}

/**
 * Record a payment against an invoice. Amounts accumulate; status flips to
 * paid when the balance reaches zero.
 */
export async function recordPayment(
  invoiceId: string,
  input: RecordPaymentInput
): Promise<Invoice> {
  const amount = round2(Math.max(0, input.amount));
  if (amount <= 0) {
    throw new DataError("Enter an amount greater than zero.");
  }
  return db.transaction("rw", [db.invoices, db.payments], async () => {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) throw new DataError("Invoice not found.");

    const amountPaid = round2(Math.min(invoice.total, invoice.payment.amountPaid + amount));
    const balance = round2(invoice.total - amountPaid);
    const status: "unpaid" | "partial" | "paid" =
      amountPaid >= invoice.total ? "paid" : "partial";

    const payment: Payment = {
      id: uid("pay"),
      invoiceId,
      amount: round2(amountPaid - invoice.payment.amountPaid),
      date: input.date,
      method: input.method ?? "other",
      reference: input.reference,
      note: input.note,
      createdAt: now(),
    };

    invoice.payment = {
      status,
      amountPaid,
      balance,
      method: payment.method,
      paidAt: new Date(`${input.date || "1970-01-01"}T12:00:00`).getTime(),
      reference: input.reference,
    };
    invoice.status = status;
    invoice.updatedAt = now();

    await db.invoices.put(invoice);
    if (payment.amount > 0) await db.payments.put(payment);
    return invoice;
  });
}

export interface MarkPaidOptions {
  method?: PaymentMethod;
  date?: string;
  reference?: string;
}

/** Pay the outstanding balance in full. */
export async function markInvoicePaid(
  invoiceId: string,
  options: MarkPaidOptions = {}
): Promise<Invoice> {
  const invoice = await db.invoices.get(invoiceId);
  if (!invoice) throw new DataError("Invoice not found.");
  if (invoice.payment.balance <= 0) return invoice;
  return recordPayment(invoiceId, {
    amount: invoice.payment.balance,
    date: options.date ?? formatDateInput(new Date()),
    method: options.method,
    reference: options.reference,
  });
}

/** Build a fresh draft from an existing invoice (Duplicate in the builder). */
export async function duplicateInvoiceToDraft(
  invoiceId: string
): Promise<InvoiceDraft> {
  const invoice = await db.invoices.get(invoiceId);
  if (!invoice) throw new DataError("Invoice not found.");
  const settings = await getSettings();
  const days = settings?.defaultPaymentTermsDays ?? 0;
  const invoiceDate = formatDateInput(new Date());
  const due = new Date(Date.now() + days * 86_400_000);
  return {
    invoiceNumber: "",
    customerId: invoice.customerId,
    customerSnapshot: { ...invoice.customerSnapshot },
    items: invoice.items.map((item) => ({ ...item, id: uid("item") })),
    invoiceDate,
    dueDate: formatDateInput(due),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxMode: invoice.taxMode,
    taxBreakup: { ...invoice.taxBreakup },
    taxableAmount: invoice.taxableAmount,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    payment: { status: "unpaid", amountPaid: 0, balance: invoice.total },
    notes: invoice.notes,
    terms: invoice.terms,
    template: invoice.template,
  };
}

/** Link a saved customer record to a previously unsaved (quick) invoice. */
export async function setInvoiceCustomer(
  invoiceId: string,
  customerId: string
): Promise<void> {
  await db.invoices.update(invoiceId, { customerId, updatedAt: now() });
}