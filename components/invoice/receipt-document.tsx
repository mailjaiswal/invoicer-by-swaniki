import { formatMoney } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { buildReceiptNumber } from "@/lib/print";
import type {
  AppSettings,
  Business,
  Invoice,
  PaymentMethod,
} from "@/lib/types";

interface ReceiptDocumentProps {
  business?: Business;
  settings?: AppSettings;
  invoice: Invoice;
  className?: string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

/**
 * A simple payment receipt, rendered on the same always-white A4 surface as
 * the invoice so both print through the same path. Visually lighter than an
 * invoice by design — no item table, just what was paid.
 */
export function ReceiptDocument({
  business,
  settings,
  invoice,
  className,
}: ReceiptDocumentProps) {
  const currency = settings?.currency ?? "INR";
  const money = (amount: number) => formatMoney(amount, currency);
  const receiptNumber = buildReceiptNumber(invoice.invoiceNumber);
  const amountReceived = invoice.payment.amountPaid;
  const paidAt = invoice.payment.paidAt
    ? new Date(invoice.payment.paidAt)
    : invoice.status === "partial" || invoice.status === "paid"
      ? new Date()
      : null;
  const method = invoice.payment.method;

  return (
    <div className={cn(className)}>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5 print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:ring-0">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-display text-xl font-bold tracking-tight text-stone-950">
                {business?.name?.trim() || "Your Business"}
              </p>
              {!!business?.address?.trim() && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-stone-500">
                  {business.address}
                </p>
              )}
              <div className="pt-1 text-xs text-stone-500">
                {!!business?.email?.trim() && <p>{business.email}</p>}
                {!!business?.phone?.trim() && <p>{business.phone}</p>}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-2xl font-bold tracking-tight text-brand-700">
                RECEIPT
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {receiptNumber}
              </p>
              <div className="mt-3 flex flex-col gap-1 text-xs text-stone-500 sm:items-end">
                {paidAt && (
                  <p>
                    Paid:{" "}
                    <span className="font-medium text-stone-800">
                      {formatDate(paidAt)}
                    </span>
                  </p>
                )}
                <p>
                  Against invoice:{" "}
                  <span className="font-medium text-stone-800">
                    {invoice.invoiceNumber}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payer + amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Received from
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-950">
                {invoice.customerSnapshot.name || "Customer"}
              </p>
              {!!invoice.customerSnapshot.company?.trim() && (
                <p className="text-xs text-stone-500">
                  {invoice.customerSnapshot.company}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Amount received
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-700">
                {money(amountReceived)}
              </p>
              {method && (
                <p className="mt-1 text-xs text-stone-500">
                  via {METHOD_LABELS[method] ?? method}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <dl className="grid gap-3 rounded-xl border border-stone-200 p-4 text-sm sm:grid-cols-2">
            <DetailRow label="Amount received" value={money(amountReceived)} />
            <DetailRow label="Payment method" value={method ? METHOD_LABELS[method] ?? method : "—"} />
            <DetailRow
              label="Date"
              value={paidAt ? formatDate(paidAt) : "—"}
            />
            <DetailRow label="Reference" value={invoice.payment.reference ?? "—"} />
          </dl>

          {/* Notes */}
          {!!invoice.notes?.trim() && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-stone-600">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-stone-100 pt-4 text-center text-[11px] text-stone-400">
            <p>
              Generated with Invoicer by Swaniki · free, offline &
              privacy-first
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}