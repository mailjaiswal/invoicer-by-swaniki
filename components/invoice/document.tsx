import { formatMoney } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { taxLabel } from "@/lib/calculations";
import type { AppSettings, Business, InvoiceStatus } from "@/lib/types";
import type { Invoice, InvoiceDraft } from "@/lib/types";
import { StatusBadge } from "./status-badge";

interface InvoiceDocumentProps {
  business?: Business;
  settings?: AppSettings;
  invoice: Invoice | InvoiceDraft;
  /** Overrides the printed number (used while previewing an unnumbered draft). */
  previewNumber?: string;
  /** Show the status pill (derived, e.g. overdue) in the header. */
  status?: InvoiceStatus;
  className?: string;
}

/**
 * The single invoice rendering engine. Used by the builder preview and the
 * invoice detail screen so what you see always matches what you send.
 * Painted on a fixed white surface so it prints and exports cleanly.
 */
export function InvoiceDocument({
  business,
  settings,
  invoice,
  previewNumber,
  status,
  className,
}: InvoiceDocumentProps) {
  const currency = settings?.currency ?? "INR";
  const money = (amount: number) => formatMoney(amount, currency);
  const number = previewNumber || invoice.invoiceNumber;

  const { cgst, sgst, igst } = invoice.taxBreakup;
  const taxRows: Array<{ label: string; amount: number }> = [];
  if (cgst) taxRows.push({ label: "CGST", amount: cgst });
  if (sgst) taxRows.push({ label: "SGST", amount: sgst });
  if (igst) taxRows.push({ label: "IGST", amount: igst });
  if (invoice.taxBreakup.amount) {
    taxRows.push({ label: "Tax", amount: invoice.taxBreakup.amount });
  }

  return (
    <div className={cn(className)}>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5">
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
                {!!business?.gstin?.trim() && (
                  <p>
                    GSTIN: <span className="uppercase">{business.gstin}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-2xl font-bold tracking-tight text-brand-700">
                INVOICE
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {number || "Preview"}
              </p>
              <div className="mt-3 flex flex-col gap-1 text-xs text-stone-500 sm:items-end">
                <p>
                  Issued:{" "}
                  <span className="font-medium text-stone-800">
                    {invoice.invoiceDate
                      ? formatIso(invoice.invoiceDate)
                      : "—"}
                  </span>
                </p>
                <p>
                  Due:{" "}
                  <span className="font-medium text-stone-800">
                    {invoice.dueDate ? formatIso(invoice.dueDate) : "—"}
                  </span>
                </p>
                {status && (
                  <div className="pt-1.5">
                    <StatusBadge status={status} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Billed to
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-950">
              {invoice.customerSnapshot.name || "Customer"}
            </p>
            {!!invoice.customerSnapshot.company?.trim() && (
              <p className="text-xs text-stone-500">
                {invoice.customerSnapshot.company}
              </p>
            )}
            <div className="mt-1 text-xs text-stone-500">
              {!!invoice.customerSnapshot.email?.trim() && (
                <p>{invoice.customerSnapshot.email}</p>
              )}
              {!!invoice.customerSnapshot.phone?.trim() && (
                <p>{invoice.customerSnapshot.phone}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="py-2 pr-3 text-right font-semibold">Qty</th>
                  <th className="py-2 pr-3 text-right font-semibold">Rate</th>
                  <th className="py-2 pr-3 text-right font-semibold">Tax</th>
                  <th className="py-2 pr-3 text-right font-semibold">Disc</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-stone-100 align-top"
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium text-stone-900">
                        {item.name || "Untitled item"}
                      </p>
                      {!!item.description && (
                        <p className="mt-0.5 text-xs text-stone-500">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right text-stone-700">
                      {trimNumber(item.quantity)}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td className="py-3 pr-3 text-right text-stone-700">
                      {money(item.rate)}
                    </td>
                    <td className="py-3 pr-3 text-right text-stone-500">
                      {taxLabel(item.taxType, item.taxRate)}
                    </td>
                    <td className="py-3 pr-3 text-right text-stone-500">
                      {item.discount ? `${trimNumber(item.discount)}%` : "—"}
                    </td>
                    <td className="py-3 text-right font-medium text-stone-900">
                      {money(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <dl className="w-full max-w-[280px] space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-medium text-stone-800">
                  {money(invoice.subtotal)}
                </dd>
              </div>
              {invoice.discount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-stone-500">Discount</dt>
                  <dd className="font-medium text-stone-800">
                    −{money(invoice.discount)}
                  </dd>
                </div>
              )}
              {invoice.taxTotal > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500">Taxable amount</dt>
                    <dd className="font-medium text-stone-800">
                      {money(invoice.taxableAmount)}
                    </dd>
                  </div>
                  {taxRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <dt className="text-stone-500">{row.label}</dt>
                      <dd className="font-medium text-stone-800">
                        {money(row.amount)}
                      </dd>
                    </div>
                  ))}
                </>
              )}
              <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                <dt className="font-semibold text-stone-900">Total</dt>
                <dd className="font-display text-lg font-bold text-stone-950">
                  {money(invoice.total)}
                </dd>
              </div>
              {invoice.payment.amountPaid > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500">Amount paid</dt>
                    <dd className="font-medium text-brand-700">
                      {money(invoice.payment.amountPaid)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-stone-700">
                      Balance due
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {money(invoice.payment.balance)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Notes & terms */}
          {(invoice.notes?.trim() || invoice.terms?.trim()) && (
            <div className="grid gap-4 border-t border-stone-100 pt-4 text-xs sm:grid-cols-2">
              {!!invoice.notes?.trim() && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-stone-600">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {!!invoice.terms?.trim() && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Terms
                  </p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-stone-600">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-stone-100 pt-4 text-center text-[11px] text-stone-400">
            <p>
              Generated with Invoicer by Swaniki · free, offline &
              privacy-first
            </p>
            {!!business?.upiId?.trim() && (
              <p className="mt-1">Pay via UPI: {business.upiId}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatIso(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function trimNumber(value: number): string {
  const num = Number.isFinite(value) ? value : 0;
  return Number.isInteger(num)
    ? String(num)
    : Number(num.toFixed(2)).toString();
}