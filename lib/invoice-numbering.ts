export const INVOICE_NUMBER_SEPARATOR = "-";

/**
 * Format a sequential number into an invoice number, e.g. `INV-0001`.
 * Prefix is trimmed; missing prefix falls back to "INV".
 */
export function formatInvoiceNumber(
  prefix: string | undefined,
  number: number,
  padding = 4
): string {
  const safePrefix = (prefix ?? "").trim() || "INV";
  const n = Math.max(1, Math.floor(number));
  return `${safePrefix}${INVOICE_NUMBER_SEPARATOR}${String(n).padStart(
    Math.max(1, Math.floor(padding)),
    "0"
  )}`;
}

/**
 * Extract the trailing numeric seed from an invoice number so the sequence
 * can be advanced past a manually typed number. Returns null when absent.
 */
export function parseInvoiceNumberSeed(invoiceNumber: string): number | null {
  const match = /(\d+)\s*$/.exec(invoiceNumber.trim());
  if (!match) return null;
  const seed = Number.parseInt(match[1], 10);
  return Number.isFinite(seed) ? seed : null;
}

/**
 * Accept manual invoice numbers with letters, digits and a few safe
 * separators. Kept deliberately loose so users can keep their own formats.
 */
export function isValidInvoiceNumberFormat(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9\s./+\-]{0,19}$/.test(value.trim());
}