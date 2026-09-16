import { formatMoney } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { taxLabel } from "@/lib/calculations";
import { buildUpiUrl, isValidUpiId } from "@/lib/upi";
import {
  DEFAULT_ACCENT_COLOR,
  INVOICE_PERSONALITIES,
  INVOICE_TEMPLATES,
  type InvoicePersonality,
  type InvoiceTemplateId,
} from "@/lib/constants";
import type { AppSettings, Business, InvoiceStatus, LogoPosition } from "@/lib/types";
import type { Invoice, InvoiceDraft } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { UpiQr } from "./upi-qr";

interface InvoiceDocumentProps {
  business?: Business;
  settings?: AppSettings;
  invoice: Invoice | InvoiceDraft;
  /** Overrides the printed number (used while previewing an unnumbered draft). */
  previewNumber?: string;
  /** Show the status pill (derived, e.g. overdue) in the header. */
  status?: InvoiceStatus;
  /** Explicit template override; defaults to the saved business preference. */
  template?: InvoiceTemplateId;
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
  template: templateProp,
  className,
}: InvoiceDocumentProps) {
  const currency = settings?.currency ?? "INR";
  const money = (amount: number) => formatMoney(amount, currency);
  const number = previewNumber || invoice.invoiceNumber;

  const accent = settings?.accentColor?.trim() || DEFAULT_ACCENT_COLOR;
  const rawSelectedTemplate = templateProp ?? settings?.defaultTemplate ?? "modern";
  const template: InvoiceTemplateId = INVOICE_TEMPLATES.some(
    (t) => t.id === rawSelectedTemplate
  )
    ? (rawSelectedTemplate as InvoiceTemplateId)
    : "modern";
  const classic = template === "classic";
  const compact = template === "compact";
  const personality: InvoicePersonality =
    INVOICE_PERSONALITIES.some((p) => p.id === settings?.personality)
      ? settings!.personality as InvoicePersonality
      : "professional";
  const minimal = personality === "minimal";
  const friendly = personality === "friendly";
  const logoPosition: LogoPosition = business?.logoPosition ?? "left";
  const showLogo = !!business?.logo && logoPosition !== "none";

  const { cgst, sgst, igst } = invoice.taxBreakup;
  const upiId = business?.upiId?.trim();
  const useUpiQr = !!upiId && !!business?.showUpiQr && isValidUpiId(upiId);
  const upiQrValue = useUpiQr
    ? buildUpiUrl({
        id: upiId,
        name: business?.name,
        amount: invoice.total,
        note: invoice.invoiceNumber
          ? `Invoice ${invoice.invoiceNumber}`
          : undefined,
      })
    : "";
  const taxRows: Array<{ label: string; amount: number }> = [];
  if (cgst) taxRows.push({ label: "CGST", amount: cgst });
  if (sgst) taxRows.push({ label: "SGST", amount: sgst });
  if (igst) taxRows.push({ label: "IGST", amount: igst });
  if (invoice.taxBreakup.amount) {
    taxRows.push({ label: "Tax", amount: invoice.taxBreakup.amount });
  }

  const containerPadding = compact
    ? "p-4 sm:p-5"
    : minimal
      ? "p-5 sm:p-6"
      : "p-6 sm:p-8";

  const logoMark = showLogo && (
    <img
      src={business?.logo ?? undefined}
      alt={`${business?.name || "Business"} logo`}
      className={cn(
        "object-contain",
        compact ? "h-9 max-w-[120px]" : "h-12 max-w-[160px]",
        logoPosition === "left" && "mb-1",
        logoPosition === "center" && "mx-auto",
        logoPosition === "right" && "ml-auto"
      )}
    />
  );

  return (
    <div className={className}>
      <div
        className={cn(
          "border border-stone-200 bg-white text-stone-900",
          compact
            ? "rounded-xl"
            : "overflow-hidden rounded-2xl shadow-sm ring-1 ring-stone-900/5 print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:ring-0",
          classic && "print:border-x-0"
        )}
        style={classic ? { borderTop: `4px solid ${accent}` } : undefined}
      >
        <div
          className={cn(
            containerPadding,
            "flex flex-col",
            compact ? "gap-3" : minimal ? "gap-4" : "gap-6"
          )}
        >
          {/* Logo on its own row for center/right placement */}
          {(logoPosition === "center" || logoPosition === "right") && logoMark}

          {/* Header */}
          {compact ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-base font-bold tracking-tight text-stone-950">
                    {business?.name?.trim() || "Your Business"}
                  </p>
                  {logoPosition === "left" && logoMark}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
                    Invoice
                  </p>
                  <p className="text-sm font-bold text-stone-950">
                    {number || "Preview"}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-stone-500">
                <span>
                  Issued {invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}
                </span>
                <span>
                  Due {invoice.dueDate ? formatIso(invoice.dueDate) : "—"}
                </span>
                {status && <StatusBadge status={status} />}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  {logoPosition === "left" && logoMark}
                  <p className={cn("font-display font-bold tracking-tight text-stone-950", classic ? "text-xl" : "text-xl")}>
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
                      <p>GSTIN: <span className="uppercase">{business.gstin}</span></p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p
                    className={cn(
                      "font-bold tracking-tight",
                      classic
                        ? "font-serif text-2xl uppercase tracking-[0.14em]"
                        : "font-display text-2xl",
                      compact ? "" : ""
                    )}
                    style={{ color: accent }}
                  >
                    Invoice
                  </p>
                  <p className={cn("text-sm font-semibold text-stone-900", classic && "mt-1 text-[13px] uppercase tracking-wide")}>
                    {number || "Preview"}
                  </p>
                  <div className="mt-3 flex flex-col gap-1 text-xs text-stone-500 sm:items-end">
                    <p>
                      Issued:{" "}
                      <span className="font-medium text-stone-800">
                        {invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}
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
              {classic && (
                <div className="border-b" style={{ borderColor: accent }} aria-hidden="true" />
              )}
            </>
          )}

          {/* Bill to */}
          <div
            className={
              classic
                ? "border-l-4 py-1 pl-4"
                : compact
                  ? ""
                  : "rounded-xl border border-stone-200 bg-stone-50 p-4"
            }
            style={classic ? { borderColor: accent } : undefined}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Billed to
            </p>
            <p className={cn("mt-1 font-semibold text-stone-950", compact ? "text-sm" : "text-sm")}>
              {invoice.customerSnapshot.name || "Customer"}
            </p>
            {!!invoice.customerSnapshot.company?.trim() && (
              <p className="text-xs text-stone-500">{invoice.customerSnapshot.company}</p>
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
                <tr className={cn("border-b text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400", compact ? "border-stone-300" : "border-stone-200")}>
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
                  <tr key={item.id} className="border-b border-stone-100 align-top">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-stone-900">
                        {item.name || "Untitled item"}
                      </p>
                      {!!item.description && (
                        <p className={cn("mt-0.5 text-stone-500", compact ? "text-[11px]" : "text-xs")}>
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
            <dl className={cn("w-full space-y-1.5", compact ? "max-w-[240px] text-xs" : "max-w-[280px] text-sm")}>
              <div className="flex items-center justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-medium text-stone-800">{money(invoice.subtotal)}</dd>
              </div>
              {invoice.discount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-stone-500">Discount</dt>
                  <dd className="font-medium text-stone-800">−{money(invoice.discount)}</dd>
                </div>
              )}
              {invoice.taxTotal > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500">Taxable amount</dt>
                    <dd className="font-medium text-stone-800">{money(invoice.taxableAmount)}</dd>
                  </div>
                  {taxRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <dt className="text-stone-500">{row.label}</dt>
                      <dd className="font-medium text-stone-800">{money(row.amount)}</dd>
                    </div>
                  ))}
                </>
              )}
              <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                <dt className="font-semibold text-stone-900">Total</dt>
                <dd className={cn("font-display font-bold text-stone-950", compact ? "text-base" : "text-lg")} style={{ color: compact ? accent : undefined }}>
                  {money(invoice.total)}
                </dd>
              </div>
              {invoice.payment.amountPaid > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500">Amount paid</dt>
                    <dd className="font-medium" style={{ color: accent }}>
                      {money(invoice.payment.amountPaid)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-stone-700">Balance due</dt>
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
            <div className={cn("grid gap-4 border-t border-stone-100 pt-4", compact ? "text-[10px]" : "text-xs", compact ? "" : "sm:grid-cols-2")}>
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
            {friendly && (
              <p className="mb-2 text-xs font-medium" style={{ color: accent }}>
                Thank you for your business!
              </p>
            )}
            <p>
              Generated with Invoicer by Swaniki · free, offline & privacy-first
            </p>
            {useUpiQr && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <UpiQr value={upiQrValue} size={96} label={`Pay via UPI: ${business?.upiId}`} />
              </div>
            )}
            {!!business?.upiId?.trim() && !useUpiQr && (
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