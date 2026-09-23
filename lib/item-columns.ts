import type { InvoiceItem } from "@/lib/types";

/**
 * Single source of truth for the invoice items table layout. Both the on-screen
 * HTML document (components/invoice/document.tsx) and the exported PDF
 * (lib/pdf.ts) consume these column definitions so the two outputs match.
 *
 * Widths are expressed as percentages of the full table/content width:
 *   - "particulars" is capped at PARTICULARS_WIDTH_PCT and its text wraps there.
 *   - "spacer" absorbs whatever width the fixed columns leave over, keeping the
 *     numeric group packed against the right margin.
 *   - each numeric column is a fixed percentage and is only present when the
 *     line items actually use it.
 */

export type ItemColumnKey =
  | "particulars"
  | "spacer"
  | "frequency"
  | "qty"
  | "rate"
  | "tax"
  | "discount"
  | "amount";

export interface ItemColumnDef {
  key: ItemColumnKey;
  label: string;
  align: "left" | "right";
  /** Percent of table/content width. Omitted for particulars + spacer. */
  width?: number;
}

export const PARTICULARS_WIDTH_PCT = 38;

/** Show quantities every time; other extras only appear when they're used. */
export function getItemColumnDefs(
  items: readonly InvoiceItem[]
): ItemColumnDef[] {
  const hasFrequency = items.some((i) => !!i.frequency?.trim());
  const hasTax = items.some((i) => i.taxType !== "none");
  const hasDiscount = items.some((i) => (i.discount ?? 0) > 0);

  const defs: ItemColumnDef[] = [
    { key: "particulars", label: "Particulars", align: "left" },
    { key: "spacer", label: "", align: "left" },
    ...(hasFrequency
      ? [{ key: "frequency" as const, label: "Frequency", align: "left" as const, width: 10 }]
      : []),
    { key: "qty", label: "Qty", align: "right", width: 6 },
    { key: "rate", label: "Rate", align: "right", width: 10 },
    ...(hasTax
      ? [{ key: "tax" as const, label: "Tax", align: "right" as const, width: 8 }]
      : []),
    ...(hasDiscount
      ? [{ key: "discount" as const, label: "Discount", align: "right" as const, width: 6 }]
      : []),
    { key: "amount", label: "Amount", align: "right", width: 14 },
  ];
  return defs;
}

/** Total percent consumed by the fixed numeric columns. */
export function numericWidthPct(defs: ItemColumnDef[]): number {
  return defs.reduce((sum, def) => sum + (def.width ?? 0), 0);
}

/** Percentage widths + guaranteed 100% total for the HTML colgroup. */
export function htmlColumnWidths(
  defs: ItemColumnDef[]
): Array<{ key: ItemColumnKey; widthPct: number }> {
  const spacerPct = Math.max(
    0,
    100 - PARTICULARS_WIDTH_PCT - numericWidthPct(defs)
  );
  return defs.map((def) => ({
    key: def.key,
    widthPct:
      def.key === "particulars"
        ? PARTICULARS_WIDTH_PCT
        : def.key === "spacer"
          ? spacerPct
          : (def.width ?? 0),
  }));
}

/**
 * Point widths for pdfmake. Mirrors htmlColumnWidths so the PDF matches the
 * screen preview: particulars is a capped percentage, the spacer is flexible
 * ("*"), and the numeric columns keep their fixed percentage of the sheet.
 */
export function pdfColumnWidths(
  defs: ItemColumnDef[],
  contentWidth: number
): Array<number | "*"> {
  return defs.map((def) => {
    if (def.key === "spacer") return "*";
    if (def.width !== undefined) return (def.width / 100) * contentWidth;
    return (PARTICULARS_WIDTH_PCT / 100) * contentWidth;
  });
}

/** Order used by any consumers that need to map cells back to columns. */
export function itemColumnKeys(defs: ItemColumnDef[]): ItemColumnKey[] {
  return defs.map((def) => def.key);
}