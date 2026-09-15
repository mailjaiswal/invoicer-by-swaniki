export type ThemeMode = "light" | "dark" | "system";
export type TaxMode = "none" | "single" | "gst" | "custom";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";

export type InvoiceStatus =
  | "draft"
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue";

export type PaymentMethod = "upi" | "bank_transfer" | "cash" | "other";

export type TaxType = "none" | "gst_cgst_sgst" | "gst_igst" | "percentage";

export interface TaxBreakup {
  type: TaxType;
  rate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  amount?: number;
}