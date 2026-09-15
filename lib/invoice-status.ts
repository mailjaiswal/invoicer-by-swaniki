import type { InvoiceStatus } from "@/lib/types";

export interface StatusLike {
  status?: InvoiceStatus;
  dueDate?: string | null;
  payment?: {
    status?: "unpaid" | "partial" | "paid";
    amountPaid?: number;
    balance?: number;
  };
}

/**
 * Derive the effective status at a point in time. Drafts are sticky; overpaid
 * past-due invoices surface as paid; past-due with an open balance are overdue.
 */
export function deriveInvoiceStatus(
  invoice: StatusLike,
  ref: Date = new Date()
): InvoiceStatus {
  if (invoice?.status === "draft") return "draft";

  const payment = invoice?.payment;
  if (payment?.status === "paid") return "paid";
  if (payment?.status === "partial") return "partial";

  const amountPaid = payment?.amountPaid ?? 0;
  if (amountPaid > 0) return "partial";

  if (invoice?.dueDate) {
    const due = new Date(`${invoice.dueDate}T23:59:59`);
    if (!Number.isNaN(due.getTime()) && due.getTime() < ref.getTime()) {
      return "overdue";
    }
  }
  return "unpaid";
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  "default" | "success" | "warning" | "danger"
> = {
  draft: "default",
  unpaid: "warning",
  partial: "warning",
  paid: "success",
  overdue: "danger",
};