import { formatMoney } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { taxLabel } from "@/lib/calculations";
import { buildUpiUrl, isValidUpiId } from "@/lib/upi";
import {
  DEFAULT_ACCENT_COLOR,
  FONT_STACKS,
  INVOICE_PERSONALITIES,
  INVOICE_TEMPLATES,
  type InvoicePersonality,
  type InvoiceTemplateId,
  type DocFontId,
} from "@/lib/constants";
import type { AppSettings, Business, InvoiceStatus, LogoPosition } from "@/lib/types";
import type { Invoice, InvoiceDraft } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { UpiQr } from "./upi-qr";

interface InvoiceDocumentProps {
  business?: Business;
  settings?: AppSettings;
  invoice: Invoice | InvoiceDraft;
  previewNumber?: string;
  status?: InvoiceStatus;
  template?: InvoiceTemplateId;
  className?: string;
}

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

  const isClassic  = template === "classic";
  const isCompact  = template === "compact";
  const isMinimal  = template === "minimal";
  const isBold     = template === "bold";
  const isElegant  = template === "elegant";

  const isQuotation = invoice.docType === "quotation";
  const docTitle = isQuotation ? "Quotation" : "Invoice";

  const personality: InvoicePersonality =
    INVOICE_PERSONALITIES.some((p) => p.id === settings?.personality)
      ? settings!.personality as InvoicePersonality
      : "professional";
  const friendly = personality === "friendly";
  const logoPosition: LogoPosition = business?.logoPosition ?? "left";
  const showLogo = !!business?.logo && logoPosition !== "none";
  const docFont: DocFontId =
    settings?.docFont && FONT_STACKS[settings.docFont] !== undefined
      ? settings.docFont
      : "roboto";

  const { cgst, sgst, igst } = invoice.taxBreakup;
  const orientation = settings?.pageOrientation ?? "portrait";
  const landscape = orientation === "landscape";
  const notesLabel = settings?.notesLabel?.trim() || "Notes";
  const termsLabel = settings?.termsLabel?.trim() || "Terms";
  const upiId = business?.upiId?.trim();
  const useUpiQr =
    !isQuotation &&
    !!upiId &&
    !!business?.showUpiQr &&
    isValidUpiId(upiId);
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

  const containerPadding = isMinimal
    ? "p-8 sm:p-10"
    : isBold
      ? "p-6 sm:p-8"
      : isElegant
        ? "p-7 sm:p-9"
        : isCompact
          ? "p-4 sm:p-5"
          : "p-6 sm:p-8";

  const logoMark = showLogo && (
    <img
      src={business?.logo ?? undefined}
      alt={`${business?.name || "Business"} logo`}
      className={cn(
        "object-contain",
        isCompact ? "h-9 max-w-[120px]" : "h-12 max-w-[160px]",
        logoPosition === "left" && "mb-1",
        logoPosition === "center" && "mx-auto",
        logoPosition === "right" && "ml-auto"
      )}
    />
  );

  /* ── Header ─────────────────────────────────────────────────────────── */

  const headerInner = (() => {
    if (isCompact) {
      return (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-display text-base font-bold tracking-tight text-stone-950">
                {business?.name?.trim() || "Your Business"}
              </p>
              {logoPosition === "left" && logoMark}
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest",
                  isBold ? "text-stone-900" : ""
                )}
                style={isBold ? { letterSpacing: "0.18em" } : { color: accent }}
              >
                {docTitle}
              </p>
              <p className="text-sm font-bold text-stone-950">{number || "Preview"}</p>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-stone-500">
            <span>Issued {invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span>
            <span>
              {isQuotation ? "Valid until" : "Due"}{" "}
              {invoice.dueDate || invoice.validityDate ? formatIso(
                (isQuotation ? invoice.validityDate : invoice.dueDate) ?? ""
              ) : "—"}
            </span>
            {status && !isQuotation && <StatusBadge status={status} />}
          </div>
        </div>
      );
    }

    /* non-compact layout */
    return (
      <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {logoPosition === "left" && logoMark}
            <p
              className={cn(
                "font-display font-bold tracking-tight text-stone-950",
                isBold ? "text-3xl uppercase tracking-tight" : isElegant ? "text-xl font-medium tracking-wide" : isMinimal ? "text-xl font-semibold tracking-wide" : "text-xl"
              )}
            >
              {business?.name?.trim() || "Your Business"}
            </p>
            {!!business?.address?.trim() && (
              <p className="whitespace-pre-line text-xs leading-relaxed text-stone-500">{business.address}</p>
            )}
            <div className="pt-1 text-xs text-stone-500">
              {!!business?.email?.trim() && <p>{business.email}</p>}
              {!!business?.phone?.trim() && <p>{business.phone}</p>}
              {!!business?.gstin?.trim() && <p>GSTIN: <span className="uppercase">{business.gstin}</span></p>}
            </div>
          </div>

          <div className="text-left sm:text-right">
            {isElegant ? (
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">{number || "Preview"}</p>
            ) : null}
            <p
              className={cn(
                "font-bold tracking-tight",
                isClassic ? "font-serif text-2xl uppercase tracking-[0.14em]" : "",
                isBold ? "text-3xl font-extrabold uppercase tracking-tight" : "",
                isElegant ? "text-2xl font-medium tracking-[0.22em] uppercase mt-1" : "",
                isMinimal ? "text-2xl font-medium text-stone-800 mt-0.5" : "",
                !isClassic && !isBold && !isElegant && !isMinimal ? "font-display text-2xl" : ""
              )}
              style={(!isClassic && !isElegant && !isMinimal) ? { color: accent } : undefined}
            >
              {isElegant ? null : docTitle}
            </p>
            {isElegant ? null : (
              <p className={cn("text-sm font-semibold text-stone-900", isClassic && "mt-1 text-[13px] uppercase tracking-wide")}>
                {number || "Preview"}
              </p>
            )}
            <div className={cn("flex flex-col gap-1 text-xs text-stone-500", isElegant ? "mt-3 sm:items-end" : "mt-3 sm:items-end")}>
              <p>Issued: <span className="font-medium text-stone-800">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
              <p>
                {isQuotation ? "Valid until" : "Due"}: <span className="font-medium text-stone-800">
                  {(isQuotation ? invoice.validityDate : invoice.dueDate)
                    ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "")
                    : "—"}
                </span>
              </p>
              {status && !isQuotation && <div className="pt-1.5"><StatusBadge status={status} /></div>}
            </div>
          </div>
        </div>

        {isClassic && <div className="border-b" style={{ borderColor: accent }} aria-hidden="true" />}
        {isElegant && (
          <div className="space-y-[2px]" aria-hidden="true">
            <div className="border-b border-stone-300" />
            <div className="border-b border-stone-300" />
          </div>
        )}
        {isBold && <div className="border-b-2" style={{ borderColor: accent }} aria-hidden="true" />}
      </>
    );
  })();

  /* ── Billed-to card ─────────────────────────────────────────────────── */

  const billedTo = (() => {
    const name = invoice.customerSnapshot.name || "Customer";
    const company = invoice.customerSnapshot.company?.trim();

    const label = (
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Billed to</p>
    );
    const content = (
      <>
        {label}
        <p className={cn("mt-1 font-semibold text-stone-950", isCompact ? "text-sm" : "text-sm")}>{name}</p>
        {!!company && <p className="text-xs text-stone-500">{company}</p>}
        <div className="mt-1 text-xs text-stone-500">
          {!!invoice.customerSnapshot.email?.trim() && <p>{invoice.customerSnapshot.email}</p>}
          {!!invoice.customerSnapshot.phone?.trim() && <p>{invoice.customerSnapshot.phone}</p>}
        </div>
      </>
    );

    if (isBold) {
      return (
        <div className="border-l-4 py-1 pl-4" style={{ borderColor: accent }}>
          {content}
        </div>
      );
    }
    if (isElegant) {
      return <div className="py-1">{content}</div>;
    }
    if (isMinimal) {
      return <div className="border-t border-stone-200 pt-3">{content}</div>;
    }
    return (
      <div
        className={isClassic ? "border-l-4 py-1 pl-4" : "rounded-xl border border-stone-200 bg-stone-50 p-4"}
        style={isClassic ? { borderColor: accent } : undefined}
      >
        {content}
      </div>
    );
  })();

  /* ── Table header row colours ────────────────────────────────────────── */

  const thRowCls = isBold
    ? "bg-stone-950 text-white border-stone-800"
    : isElegant
      ? "border-stone-300"
      : isMinimal
        ? "border-stone-200"
        : isCompact
          ? "border-stone-300"
          : "border-stone-200";

  const thCellCls = cn(
    "py-2 font-semibold",
    isBold ? "text-white" : "text-[11px] font-semibold uppercase tracking-wider text-stone-400",
    isElegant ? "text-[11px] uppercase tracking-[0.18em] text-stone-500" : "",
    isMinimal ? "text-[11px] uppercase tracking-wider text-stone-400" : ""
  );

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div
      className={className}
      style={FONT_STACKS[docFont] ? { fontFamily: FONT_STACKS[docFont] } : undefined}
    >
      {landscape && (
        <style>{`@page { size: A4 landscape; margin: 12mm; }`}</style>
      )}
      <div
        className={cn(
          "border border-stone-200 bg-white text-stone-900",
          isCompact
            ? "rounded-xl"
            : "overflow-hidden rounded-2xl shadow-sm ring-1 ring-stone-900/5 print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:ring-0",
          isClassic && "print:border-x-0"
        )}
        style={isClassic ? { borderTop: `4px solid ${accent}` } : isBold ? { borderTop: `6px solid ${accent}` } : isMinimal ? { borderTop: "1px solid #d6d3d1" } : undefined}
      >
        <div className={cn(containerPadding, "flex flex-col", isCompact ? "gap-3" : isMinimal ? "gap-5" : isElegant ? "gap-6" : "gap-6")}>
          {/* Logo row for center/right */}
          {(logoPosition === "center" || logoPosition === "right") && logoMark}

          {headerInner}

          {/* Billed to */}
          {billedTo}

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className={cn("border-b text-left", thRowCls, thCellCls)}>
                  <th className="py-2 pr-3 font-semibold">Particulars</th>
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
                    <td className="py-2.5 pr-3">
                      <p className="truncate font-semibold text-stone-900" style={{ fontSize: "13px", lineHeight: "1.35" }}>
                        {item.name || "Untitled item"}
                      </p>
                      {!!item.description && (
                        <p className="truncate text-stone-500" style={{ fontSize: "11px", lineHeight: "1.4", marginTop: "2px" }}>
                          {item.description}
                        </p>
                      )}
                      {!!item.comments && (
                        <p className="truncate italic text-stone-500" style={{ fontSize: "11px", lineHeight: "1.4", marginTop: "1px" }}>
                          {item.comments.replace(/\s+/g, " ").trim()}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-stone-700" style={{ fontSize: "13px" }}>{trimNumber(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</td>
                    <td className="py-2.5 pr-3 text-right text-stone-700" style={{ fontSize: "13px" }}>{money(item.rate)}</td>
                    <td className="py-2.5 pr-3 text-right text-stone-500" style={{ fontSize: "13px" }}>{taxLabel(item.taxType, item.taxRate)}</td>
                    <td className="py-2.5 pr-3 text-right text-stone-500" style={{ fontSize: "13px" }}>{item.discount ? `${trimNumber(item.discount)}%` : "—"}</td>
                    <td className="py-2.5 text-right font-medium text-stone-900" style={{ fontSize: "13px" }}>{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <dl className={cn("w-full space-y-1.5", isCompact ? "max-w-[240px] text-xs" : "max-w-[280px] text-sm")}>
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
              <div className={cn("flex items-center justify-between pt-2", isElegant ? "border-t border-stone-300" : "border-t border-stone-200")}>
                <dt className="font-semibold text-stone-900">Total</dt>
                <dd
                  className={cn(
                    "font-display font-bold text-stone-950",
                    isBold ? "text-xl font-extrabold" : isElegant ? "font-semibold text-lg" : isMinimal ? "font-semibold text-lg" : isCompact ? "text-base" : "text-lg"
                  )}
                  style={isCompact || isBold ? { color: accent } : undefined}
                >
                  {money(invoice.total)}
                </dd>
              </div>
              {invoice.payment.amountPaid > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500">Amount paid</dt>
                    <dd className="font-medium" style={{ color: accent }}>{money(invoice.payment.amountPaid)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-stone-700">Balance due</dt>
                    <dd className="font-semibold text-stone-900">{money(invoice.payment.balance)}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Notes & terms */}
          {(invoice.notes?.trim() || invoice.terms?.trim()) && (
            <div className={cn("grid gap-4 border-t border-stone-100 pt-4", isCompact ? "text-[10px]" : "text-xs", isCompact ? "" : "sm:grid-cols-2")}>
              {!!invoice.notes?.trim() && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{notesLabel}</p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-stone-600">{invoice.notes}</p>
                </div>
              )}
              {!!invoice.terms?.trim() && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{termsLabel}</p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-stone-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={cn("pt-4 text-center text-[11px] text-stone-400", isElegant ? "border-t border-stone-200" : "border-t border-stone-100")}>
            {friendly && (
              <p className="mb-2 text-xs font-medium" style={{ color: accent }}>Thank you for your business!</p>
            )}
            <p>Generated with Invoicer by Swaniki · free, offline &amp; privacy-first</p>
            <p className="mt-1 text-[10px] text-stone-300">Not tax or legal advice — verify for your jurisdiction before publishing.</p>
            {useUpiQr && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <UpiQr value={upiQrValue} size={96} label={`Pay via UPI: ${business?.upiId}`} />
              </div>
            )}
            {!isQuotation && !!business?.upiId?.trim() && !useUpiQr && <p className="mt-1">Pay via UPI: {business.upiId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatIso(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function trimNumber(value: number): string {
  const num = Number.isFinite(value) ? value : 0;
  return Number.isInteger(num) ? String(num) : Number(num.toFixed(2)).toString();
}
