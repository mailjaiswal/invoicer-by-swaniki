/**
 * Print / PDF helpers. The app renders one document component and lets the
 * browser print it at A4 (Print -> Save as PDF on most devices), so the
 * exported PDF matches the screen preview exactly — no second engine.
 */

/** Whether the current browser can open the native print dialog. */
export function printIsAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.print === "function";
}

/** Open the native print dialog. Returns false when the API is unavailable. */
export function triggerPrint(): boolean {
  if (!printIsAvailable()) return false;
  try {
    window.print();
    return true;
  } catch {
    return false;
  }
}

/**
 * Deterministic receipt number derived from an invoice, e.g. RCPT-INV-0001.
 * Reusing the invoice number makes the receipt clearly linked to its invoice.
 */
export function buildReceiptNumber(invoiceNumber: string): string {
  const seed = String(invoiceNumber ?? "").trim();
  if (!seed) return "RCPT";
  return `RCPT-${seed}`;
}