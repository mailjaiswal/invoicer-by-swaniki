import type { TaxBreakup, TaxType } from "@/lib/types";

/**
 * Round a value to two decimal places ("half up").
 * All money values are stored as 2-decimal amounts.
 */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const toCents = (n: number): number => {
  const v = Number.isFinite(n) ? n : 0;
  return Math.round(v * 100);
};

const fraction = (percent: number): number => {
  const v = Number.isFinite(percent) ? percent : 0;
  return v / 100;
};

export interface LineFields {
  quantity: number;
  rate: number;
  /** Line-level discount, as a percent (0-100). */
  discount: number;
  taxType: TaxType;
  /** Tax rate as a percent (e.g. 18). For CGST+SGST, the total is split in half. */
  taxRate: number;
}

export interface LineCalculation extends LineFields {
  gross: number;
  discountAmount: number;
  net: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  other: number;
  lineTotal: number;
}

/**
 * Compute a single line item. Arithmetic is scaled to integer cents and rounded
 * at each step so results are deterministic and free of float drift.
 */
export function calcLine(fields: LineFields): LineCalculation {
  const { quantity, rate, discount, taxType, taxRate } = fields;
  const qtyCents = toCents(quantity);
  const rateValue = Number.isFinite(rate) ? rate : 0;
  const grossCents = Math.round(qtyCents * rateValue);
  const discountCents = Math.round(grossCents * fraction(discount));
  const netCents = grossCents - discountCents;

  let cgstCents = 0;
  let sgstCents = 0;
  let igstCents = 0;
  let otherCents = 0;

  if (taxType === "percentage") {
    otherCents = Math.round(netCents * fraction(rateToPercent(taxRate)));
  } else if (taxType === "gst_cgst_sgst") {
    const halfPercent = rateToPercent(taxRate) / 2;
    cgstCents = Math.round(netCents * fraction(halfPercent));
    sgstCents = Math.round(netCents * fraction(halfPercent));
  } else if (taxType === "gst_igst") {
    igstCents = Math.round(netCents * fraction(rateToPercent(taxRate)));
  }

  const taxCents = cgstCents + sgstCents + igstCents + otherCents;
  const lineTotalCents = Math.max(0, netCents + taxCents);

  return {
    quantity,
    rate,
    discount,
    taxType,
    taxRate,
    gross: grossCents / 100,
    discountAmount: discountCents / 100,
    net: netCents / 100,
    taxAmount: taxCents / 100,
    cgst: cgstCents / 100,
    sgst: sgstCents / 100,
    igst: igstCents / 100,
    other: otherCents / 100,
    lineTotal: lineTotalCents / 100,
  };
}

function rateToPercent(rate: number): number {
  return Number.isFinite(rate) ? rate : 0;
}

export interface TotalsBreakup {
  cgst: number;
  sgst: number;
  igst: number;
  other: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxTotal: number;
  breakup: TotalsBreakup;
  total: number;
}

export interface InvoiceCalculation {
  lines: LineCalculation[];
  totals: InvoiceTotals;
}

/**
 * Aggregate totals across lines. Handles mixed tax types by summing each
 * component (CGST / SGST / IGST / other percentage) separately.
 */
export function calcInvoiceTotals(fields: LineFields[]): InvoiceCalculation {
  const lines = fields.map(calcLine);

  const sumOf = (key: "gross" | "discountAmount" | "net"): number =>
    round2(lines.reduce((acc, line) => acc + line[key], 0));

  const cgst = round2(lines.reduce((acc, line) => acc + line.cgst, 0));
  const sgst = round2(lines.reduce((acc, line) => acc + line.sgst, 0));
  const igst = round2(lines.reduce((acc, line) => acc + line.igst, 0));
  const other = round2(lines.reduce((acc, line) => acc + line.other, 0));

  const subtotal = sumOf("gross");
  const discount = sumOf("discountAmount");
  const taxableAmount = sumOf("net");
  const taxTotal = round2(cgst + sgst + igst + other);
  const total = round2(taxableAmount + taxTotal);

  return {
    lines,
    totals: {
      subtotal,
      discount,
      taxableAmount,
      taxTotal,
      breakup: { cgst, sgst, igst, other },
      total,
    },
  };
}

/**
 * Collapse totals into the `TaxBreakup` shape persisted on an invoice.
 * The component amounts are aggregated; `rate` is informational.
 */
export function taxBreakupFromTotals(
  totals: InvoiceTotals,
  fallbackRate = 0
): TaxBreakup {
  const { cgst, sgst, igst, other } = totals.breakup;
  const type: TaxType =
    cgst || sgst
      ? "gst_cgst_sgst"
      : igst
        ? "gst_igst"
        : other
          ? "percentage"
          : "none";
  return { type, rate: fallbackRate, cgst, sgst, igst, amount: other };
}

/** Short human label for a line's tax line, e.g. "18%", "IGST 18%". */
export function taxLabel(taxType: TaxType, taxRate: number): string {
  const rate = Number.isFinite(taxRate) ? taxRate : 0;
  if (!rate || taxType === "none") return "—";
  if (taxType === "percentage") return `${rate}%`;
  if (taxType === "gst_cgst_sgst") {
    const half = Math.round(rate * 100) / 100 / 2;
    return `CGST ${half}% + SGST ${half}%`;
  }
  if (taxType === "gst_igst") return `IGST ${rate}%`;
  return "—";
}