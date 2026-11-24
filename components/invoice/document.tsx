import { formatMoney } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { taxLabel } from "@/lib/calculations";
import { buildUpiUrl, isValidUpiId } from "@/lib/upi";
import {
  contrastTextOn,
  paletteForTemplate,
  resolveAccent,
} from "@/lib/template-palettes";
import {
  getItemColumnDefs,
  htmlColumnWidths,
} from "@/lib/item-columns";
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

  const rawSelectedTemplate = templateProp ?? settings?.defaultTemplate ?? "modern";
  const template: InvoiceTemplateId = INVOICE_TEMPLATES.some(
    (t) => t.id === rawSelectedTemplate
  )
    ? (rawSelectedTemplate as InvoiceTemplateId)
    : "modern";
  // resolveAccent returns hex WITHOUT '#'; CSS needs the '#', so add it back.
  const accent = `#${resolveAccent(settings?.accentColor, template)}`;
  const palette = paletteForTemplate(template);
  const headerTint = palette.headerTint ? `#${palette.headerTint}` : null;

  const isClassic  = template === "classic";
  const isCompact  = template === "compact";
  const isMinimal  = template === "minimal";
  const isBold     = template === "bold";
  const isElegant  = template === "elegant";
  const isBar      = template === "bar";
  const isAtelier  = template === "atelier";
  const isQuartz   = template === "quartz";
  const isNordic   = template === "nordic";
  const isBotanical= template === "botanical";
  const isCouture  = template === "couture";
  const isSolarpunk= template === "solarpunk";
  const isAura     = template === "aura";
  const isSwiss    = template === "swiss";
  const isNoir     = template === "noir";
  const isCobalt   = template === "cobalt";
  const isVelvet   = template === "velvet";

  const gradientFrom = settings?.headerGradientFrom?.trim();
  const gradientTo = settings?.headerGradientTo?.trim();
  const customGradient =
    gradientFrom && gradientTo
      ? `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
      : null;

  const hideBadge = !!settings?.hideTemplateBadge;
  const customBadgeText = settings?.templateBadgeText?.trim();

  /** Table header fill/text and band ink, mirroring the PDF engine (lib/pdf.ts). */
  const headerFill = headerTint ?? (isBold ? "#1c1917" : undefined);
  const headerText = headerTint ? (isBold ? "#ffffff" : accent) : undefined;
  const bandInk = contrastTextOn(accent) === "white" ? "#ffffff" : "#1c1917";

  const isQuotation = invoice.docType === "quotation";
  const docTitle = isQuotation ? "Quotation" : "Invoice";

  const lineItems = invoice.items ?? [];
  const columnDefs = getItemColumnDefs(lineItems);
  const columnWidths = htmlColumnWidths(columnDefs);

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
  /** Screen approximation of one A4 page (portrait 794Ã—1123, landscape 1123Ã—794). */
  const pageHeight = landscape ? 794 : 1123;
  const notesLabel = settings?.notesLabel?.trim() || "Notes";
  const termsLabel = settings?.termsLabel?.trim() || "Terms";
  const upiId = business?.upiId?.trim();
  const showQr = business?.showUpiQr !== false;
  const useUpiQr =
    !isQuotation &&
    !!upiId &&
    showQr &&
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

  /* ── Header ──────────────────────────────────────────────────────────── */

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

    if (isAura) {
      return (
        <div
          className="rounded-2xl p-6 sm:p-7 text-white shadow-md"
          style={{ background: customGradient ?? "linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #EC4899 100%)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {logoPosition === "left" && logoMark}
              {!hideBadge && (
                <div className="inline-block rounded-full border border-white/30 bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {customBadgeText || "Studio Invoice"}
                </div>
              )}
              <p className="pt-1 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                {business?.name?.trim() || "Your Business"}
              </p>
              {!!business?.address?.trim() && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-white/85">{business.address}</p>
              )}
              <div className="pt-1 text-xs text-white/80">
                {!!business?.email?.trim() && <p>{business.email}</p>}
                {!!business?.phone?.trim() && <p>{business.phone}</p>}
                {!!business?.gstin?.trim() && <p>GSTIN: <span className="uppercase font-mono">{business.gstin}</span></p>}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">{docTitle}</p>
              <p className="text-xl font-black text-white">{number || "Preview"}</p>
              <div className="mt-2 space-y-1 text-xs text-white/90">
                <p>Issued: <span className="font-semibold text-white">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
                <p>{isQuotation ? "Valid until" : "Due"}: <span className="font-semibold text-white">{(isQuotation ? invoice.validityDate : invoice.dueDate) ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "") : "—"}</span></p>
              </div>
              {status && !isQuotation && <div className="pt-2 sm:flex sm:justify-end"><StatusBadge status={status} /></div>}
            </div>
          </div>
        </div>
      );
    }

    if (isSwiss) {
      return (
        <div>
          <div
            className="h-2 w-full mb-5"
            style={{ backgroundColor: gradientFrom || "#002FA7" }}
            aria-hidden="true"
          />
          <div className="border-b-[3px] border-black pb-5">
            <div className="grid gap-6 sm:grid-cols-[1.5fr_1fr]">
              <div>
                {!hideBadge && (
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.25em]"
                    style={{ color: gradientFrom || "#002FA7" }}
                  >
                    {customBadgeText || "SYSTEM // 05"}
                  </p>
                )}
                <p className="font-display text-4xl font-black uppercase tracking-tight text-black sm:text-5xl">
                  {docTitle}
                </p>
                <p className="mt-1 font-mono text-base font-bold text-black">{number || "Preview"}</p>
              </div>
              <div className="space-y-1 text-left sm:text-right">
                {logoPosition === "left" && logoMark}
                <p className="text-lg font-black uppercase tracking-tight text-black">
                  {business?.name?.trim() || "Your Business"}
                </p>
                {!!business?.address?.trim() && (
                  <p className="whitespace-pre-line text-xs leading-relaxed text-stone-600">{business.address}</p>
                )}
                <div className="pt-1 text-xs text-stone-600">
                  {!!business?.email?.trim() && <p>{business.email}</p>}
                  {!!business?.phone?.trim() && <p>{business.phone}</p>}
                  {!!business?.gstin?.trim() && <p className="font-mono">GSTIN: {business.gstin.toUpperCase()}</p>}
                </div>
                <div className="mt-2 text-xs text-stone-700">
                  <p>Issued: <span className="font-bold text-black">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
                  <p>{isQuotation ? "Valid until" : "Due"}: <span className="font-bold text-black">{(isQuotation ? invoice.validityDate : invoice.dueDate) ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "") : "—"}</span></p>
                </div>
                {status && !isQuotation && <div className="pt-2 sm:flex sm:justify-end"><StatusBadge status={status} /></div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isNoir) {
      return (
        <div
          className="rounded-xl p-6 sm:p-7 text-white border-b-[3px] shadow-md"
          style={{
            background: customGradient ?? "#111113",
            borderColor: gradientTo || "#D4AF37",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {logoPosition === "left" && logoMark}
              {!hideBadge && (
                <div
                  className="inline-block rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: `${gradientTo || "#D4AF37"}80`,
                    backgroundColor: `${gradientTo || "#D4AF37"}1A`,
                    color: gradientTo || "#D4AF37",
                  }}
                >
                  {customBadgeText || "Private Advisory"}
                </div>
              )}
              <p className="pt-1 font-display text-2xl font-bold tracking-tight text-white">
                {business?.name?.trim() || "Your Business"}
              </p>
              {!!business?.address?.trim() && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-zinc-400">{business.address}</p>
              )}
              <div className="pt-1 text-xs text-zinc-400">
                {!!business?.email?.trim() && <p>{business.email}</p>}
                {!!business?.phone?.trim() && <p>{business.phone}</p>}
                {!!business?.gstin?.trim() && <p>GSTIN: <span className="uppercase text-zinc-300 font-mono">{business.gstin}</span></p>}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: gradientTo || "#D4AF37" }}>{docTitle}</p>
              <p className="text-xl font-bold text-white">{number || "Preview"}</p>
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                <p>Issued: <span className="font-medium text-zinc-200">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
                <p>{isQuotation ? "Valid until" : "Due"}: <span className="font-medium text-zinc-200">{(isQuotation ? invoice.validityDate : invoice.dueDate) ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "") : "—"}</span></p>
              </div>
              {status && !isQuotation && <div className="pt-2 sm:flex sm:justify-end"><StatusBadge status={status} /></div>}
            </div>
          </div>
        </div>
      );
    }

    if (isCobalt) {
      return (
        <div className="grid gap-4 sm:grid-cols-[1.8fr_1fr]">
          <div
            className="rounded-2xl p-6 text-white shadow-md"
            style={{ background: customGradient ?? "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)" }}
          >
            {!hideBadge && (
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {customBadgeText || "Official Invoice"}
              </span>
            )}
            <p className="pt-2 font-display text-2xl font-black tracking-tight text-white">
              {business?.name?.trim() || "Your Business"}
            </p>
            {!!business?.address?.trim() && (
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-white/85">{business.address}</p>
            )}
            <div className="pt-1 text-xs text-white/85">
              {!!business?.email?.trim() && <p>{business.email}</p>}
              {!!business?.phone?.trim() && <p>{business.phone}</p>}
              {!!business?.gstin?.trim() && <p>GSTIN: <span className="uppercase font-mono">{business.gstin}</span></p>}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{docTitle}</p>
            <p className="text-lg font-bold text-slate-900">{number || "Preview"}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>Issued: <span className="font-medium text-slate-900">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
              <p>{isQuotation ? "Valid until" : "Due"}: <span className="font-medium text-slate-900">{(isQuotation ? invoice.validityDate : invoice.dueDate) ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "") : "—"}</span></p>
            </div>
            {status && !isQuotation && <div className="pt-2"><StatusBadge status={status} /></div>}
          </div>
        </div>
      );
    }

    if (isVelvet) {
      return (
        <div
          className="rounded-xl p-6 sm:p-7 text-[#ECFDF5] border-b-[3px] shadow-md"
          style={{
            background: customGradient ?? "#064E3B",
            borderColor: gradientTo || "#10B981",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {!hideBadge && (
                <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                  {customBadgeText || "Sustainable Enterprise"}
                </span>
              )}
              <p className="pt-2 font-display text-2xl font-bold tracking-tight text-white">
                {business?.name?.trim() || "Your Business"}
              </p>
              {!!business?.address?.trim() && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-emerald-100/80">{business.address}</p>
              )}
              <div className="pt-1 text-xs text-emerald-100/80">
                {!!business?.email?.trim() && <p>{business.email}</p>}
                {!!business?.phone?.trim() && <p>{business.phone}</p>}
                {!!business?.gstin?.trim() && <p>GSTIN: <span className="uppercase font-mono">{business.gstin}</span></p>}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">{docTitle}</p>
              <p className="text-xl font-bold text-white">{number || "Preview"}</p>
              <div className="mt-2 space-y-1 text-xs text-emerald-100/90">
                <p>Issued: <span className="font-medium text-white">{invoice.invoiceDate ? formatIso(invoice.invoiceDate) : "—"}</span></p>
                <p>{isQuotation ? "Valid until" : "Due"}: <span className="font-medium text-white">{(isQuotation ? invoice.validityDate : invoice.dueDate) ? formatIso((isQuotation ? invoice.validityDate : invoice.dueDate) ?? "") : "—"}</span></p>
              </div>
              {status && !isQuotation && <div className="pt-2 sm:flex sm:justify-end"><StatusBadge status={status} /></div>}
            </div>
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
        {isAtelier && <div className="border-b border-[#E7E2D8]" aria-hidden="true" />}
        {isQuartz && <div className="border-b border-indigo-100" aria-hidden="true" />}
        {isNordic && <div className="border-b border-[#E3DDD1]" aria-hidden="true" />}
        {isBotanical && <div className="border-b border-[#D7CEBE]" aria-hidden="true" />}
        {isCouture && <div className="border-b border-black" aria-hidden="true" />}
        {isSolarpunk && <div className="border-b border-emerald-100" aria-hidden="true" />}
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
    if (isAtelier) {
      return (
        <div className="rounded-xl border border-[#E7E2D8] bg-white/80 p-4">
          {content}
        </div>
      );
    }
    if (isQuartz) {
      return (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4">
          {content}
        </div>
      );
    }
    if (isNordic) {
      return (
        <div className="rounded-2xl border border-[#EBE4D8] bg-white/80 p-4">
          {content}
        </div>
      );
    }
    if (isBotanical) {
      return (
        <div className="rounded-xl border border-[#D7CEBE] bg-white/80 p-4">
          {content}
        </div>
      );
    }
    if (isCouture) {
      return (
        <div className="border-l-4 border-black py-1 pl-4">
          {content}
        </div>
      );
    }
    if (isSolarpunk) {
      return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
          {content}
        </div>
      );
    }
    if (isAura) {
      return (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
          {content}
        </div>
      );
    }
    if (isSwiss) {
      return (
        <div className="border-2 border-black p-4">
          {content}
        </div>
      );
    }
    if (isNoir) {
      return (
        <div className="rounded-xl border border-stone-200 border-l-4 border-l-[#D4AF37] bg-stone-50 p-4">
          {content}
        </div>
      );
    }
    if (isCobalt) {
      return (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          {content}
        </div>
      );
    }
    if (isVelvet) {
      return (
        <div className="rounded-xl border border-emerald-200 bg-white/90 p-4">
          {content}
        </div>
      );
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
    ? "text-white border-stone-800"
    : isSwiss
      ? "border-y-2 border-black text-black"
      : isCobalt
        ? "border-y border-blue-200"
        : isElegant
          ? "border-stone-300"
          : isMinimal
            ? "border-stone-200"
            : isCompact ? "border-stone-300" : "border-stone-200";

  const thCellCls = cn(
    "py-2 font-semibold",
    isBold ? "text-white" : isSwiss ? "text-black font-extrabold uppercase tracking-wider text-[11px]" : "text-[11px] font-semibold uppercase tracking-wider text-stone-400",
    isElegant ? "text-[11px] uppercase tracking-[0.18em] text-stone-500" : "",
    isMinimal ? "text-[11px] uppercase tracking-wider text-stone-400" : "",
    isCobalt ? "text-[#1D4ED8]" : "",
    isVelvet ? "text-[#064E3B]" : "",
    isNoir ? "text-zinc-800" : ""
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
          "doc-page-min flex flex-col border border-stone-200 bg-white text-stone-900 print:bg-white",
          isCompact
            ? "rounded-xl"
            : "overflow-hidden rounded-2xl shadow-sm ring-1 ring-stone-900/5 print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:ring-0",
          isClassic && "print:border-x-0"
        )}
        style={{
          minHeight: pageHeight,
          ...(isClassic
            ? { borderTop: `4px solid ${accent}` }
            : isBold
              ? { borderTop: `6px solid ${accent}` }
              : isAtelier
                ? { borderTop: "4px solid #1C1917", backgroundColor: "#FCFAF6" }
                : isQuartz
                  ? { borderTop: "4px solid #4F46E5" }
                  : isNordic
                    ? { borderTop: "4px solid #B4533C", backgroundColor: "#F9F6F0" }
                    : isBotanical
                      ? { borderTop: "4px solid #1E3024", backgroundColor: "#FAF8F5" }
                      : isCouture
                        ? { borderTop: "4px solid #000000" }
                        : isSolarpunk
                          ? { borderTop: "4px solid #059669" }
                          : isAura
                            ? { borderTop: "4px solid #4338CA" }
                            : isSwiss
                              ? { borderTop: "none" }
                              : isNoir
                                ? { borderTop: "none" }
                                : isCobalt
                                  ? { borderTop: "4px solid #1E40AF" }
                                  : isVelvet
                                    ? { borderTop: "none", backgroundColor: "#F7FAF8" }
                                    : isMinimal
                    ? { borderTop: "1px solid #d6d3d1" }
                    : {}),
        }}
      >
        {isBar && (
          <div aria-hidden="true" className="h-2.5 w-full shrink-0" style={{ backgroundColor: accent }} />
        )}
        <div className={cn(containerPadding, "flex flex-1 flex-col", isCompact ? "gap-3" : isMinimal ? "gap-5" : isElegant ? "gap-6" : "gap-6")}>
          {/* Logo row for center/right */}
          {(logoPosition === "center" || logoPosition === "right") && logoMark}

          {headerInner}

          {/* Billed to */}
          {billedTo}

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] table-fixed border-collapse text-sm">
              <colgroup>
                {columnWidths.map((col) => (
                  <col key={col.key} style={{ width: `${col.widthPct}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr
                  className={cn("border-b text-left", thRowCls, thCellCls)}
                  style={headerFill ? { backgroundColor: headerFill } : undefined}
                >
                  {columnDefs.map((def) => (
                    <th
                      key={def.key}
                      className={cn(
                        "py-2 whitespace-nowrap",
                        headerFill && "px-2",
                        def.key !== "spacer" && def.key !== "amount" && "pr-3 font-semibold",
                        def.key === "amount" && "font-semibold",
                        def.align === "right" && "text-right"
                      )}
                      style={headerText ? { color: headerText } : undefined}
                      aria-hidden={def.key === "spacer" || undefined}
                    >
                      {def.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100 align-top">
                    {columnDefs.map((def) => {
                      switch (def.key) {
                        case "particulars":
                          return (
                            <td key={def.key} className="break-words py-2.5 pr-3">
                              <p className="break-words font-semibold text-stone-900" style={{ fontSize: "13px", lineHeight: "1.35" }}>
                                {item.name || "Untitled item"}
                              </p>
                              {!!item.description && (
                                <p className="break-words text-stone-500" style={{ fontSize: "11px", lineHeight: "1.4", marginTop: "2px" }}>
                                  {item.description}
                                </p>
                              )}
                              {!!item.comments && (
                                <p className="break-words italic text-stone-500" style={{ fontSize: "11px", lineHeight: "1.4", marginTop: "1px" }}>
                                  {item.comments.replace(/\s+/g, " ").trim()}
                                </p>
                              )}
                            </td>
                          );
                        case "spacer":
                          return <td key={def.key} className="py-2.5" aria-hidden="true" />;
                        case "frequency":
                          return (
                            <td
                              key={def.key}
                              className="break-words py-2.5 pr-3 text-stone-600"
                              style={{ fontSize: "11px" }}
                            >
                              {item.frequency?.trim() || "\u2014"}
                            </td>
                          );
                        case "qty":
                          return (
                            <td key={def.key} className="py-2.5 pr-3 text-right text-stone-700 whitespace-nowrap" style={{ fontSize: "13px" }}>{trimNumber(item.quantity)}</td>
                          );
                        case "rate":
                          return (
                            <td key={def.key} className="py-2.5 pr-3 text-right text-stone-700 whitespace-nowrap" style={{ fontSize: "13px" }}>{money(item.rate)}</td>
                          );
                        case "tax":
                          return (
                            <td key={def.key} className="py-2.5 pr-3 text-right text-stone-500 whitespace-nowrap" style={{ fontSize: "13px" }}>{taxLabel(item.taxType, item.taxRate)}</td>
                          );
                        case "discount":
                          return (
                            <td key={def.key} className="py-2.5 pr-3 text-right text-stone-500 whitespace-nowrap" style={{ fontSize: "13px" }}>{item.discount ? `${trimNumber(item.discount)}%` : "\u2014"}</td>
                          );
                        case "amount":
                          return (
                            <td key={def.key} className="py-2.5 text-right font-medium text-stone-900 whitespace-nowrap" style={{ fontSize: "13px" }}>{money(item.lineTotal)}</td>
                          );
                        default:
                          return null;
                      }
                    })}
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
          {!isBar && (invoice.notes?.trim() || invoice.terms?.trim()) && (
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

          {/* Payment & UPI QR section */}
          {!isBar && !isQuotation && !!upiId && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 sm:flex-row dark:border-stone-800 dark:bg-stone-900/40">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Instant Payment via UPI
                </p>
                <p className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                  {upiId}
                </p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  Scan with GPay, PhonePe, Paytm, BHIM or any UPI app
                </p>
              </div>
              {useUpiQr && (
                <div className="flex shrink-0 items-center justify-center">
                  <UpiQr value={upiQrValue} size={92} className="gap-1" />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={cn("mt-auto border-t pt-4 text-center text-[11px] text-stone-400", isElegant ? "border-stone-200" : "border-stone-100")}>
            {friendly && !isBar && (
              <p className="mb-2 text-xs font-medium" style={{ color: accent }}>Thank you for your business!</p>
            )}
            <p>Generated with Invoicer by Swaniki · free, offline &amp; privacy-first</p>
            <p className="mt-1 text-[10px] text-stone-300">Not tax or legal advice — verify for your jurisdiction before publishing.</p>
          </div>
        </div>

        {/* Bar template: solid accent band pinned to the bottom, mirroring the PDF */}
        {isBar && (
          <div
            className="mt-4 px-6 py-4 text-xs sm:px-8"
            style={{ backgroundColor: accent, color: bandInk }}
          >
            {(invoice.notes?.trim() || invoice.terms?.trim()) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {!!invoice.notes?.trim() && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{notesLabel}</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed opacity-90">{invoice.notes}</p>
                  </div>
                )}
                {!!invoice.terms?.trim() && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{termsLabel}</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed opacity-90">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
            {friendly && (
              <p className="mt-3 text-center font-semibold">Thank you for your business!</p>
            )}
            {useUpiQr && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <UpiQr value={upiQrValue} size={96} label={`Pay via UPI: ${business?.upiId}`} />
              </div>
            )}
            {!useUpiQr && !!business?.upiId?.trim() && (
              <p className="mt-2 text-center text-[11px] opacity-80">Pay via UPI: {business?.upiId}</p>
            )}
          </div>
        )}
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
