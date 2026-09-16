/**
 * UPI helpers. QR codes are generated locally from a `upi://pay` deep link so
 * no payment data ever leaves the device (spec §19).
 */

/** Reasonable UPI ID format: handle@psp, e.g. name@oksbi. */
export const UPI_ID_PATTERN = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

export function isValidUpiId(id?: string | null): boolean {
  return typeof id === "string" && UPI_ID_PATTERN.test(id.trim());
}

export interface UpiPayParams {
  /** Payee address / UPI ID, e.g. swaniki@oksbi. */
  id: string;
  /** Payee (business) name shown to the payer. */
  name?: string;
  /** Amount to request. */
  amount?: number;
  /** Transaction note, typically the invoice reference. */
  note?: string;
}

/**
 * Build the UPI deep link encoded into the QR:
 * `upi://pay?pa=<id>&pn=<name>&am=<amount>&cu=INR&tn=<note>`
 */
export function buildUpiUrl({
  id,
  name,
  amount,
  note,
}: UpiPayParams): string {
  const params = new URLSearchParams();
  params.set("pa", id.trim());
  const payeeName = name?.trim();
  if (payeeName) params.set("pn", payeeName);
  const amt = Number(amount);
  if (Number.isFinite(amt) && amt > 0) params.set("am", String(amt));
  const txn = note?.trim();
  if (txn) params.set("tn", txn);
  params.set("cu", "INR");
  return `upi://pay?${params.toString()}`;
}

/** Human label shown under a QR, e.g. "swaniki@oksbi". */
export function formatUpiIdLabel(id: string): string {
  return id.trim();
}