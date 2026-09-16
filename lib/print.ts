/**
 * Print helpers. Real PDFs are generated client-side with pdfmake (see
 * `lib/pdf.ts`); this module still powers the Print button, which opens the
 * browser's native print dialog (Print -> Save as PDF) so users have a
 * pixel-perfect fallback for the exact on-screen document.
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