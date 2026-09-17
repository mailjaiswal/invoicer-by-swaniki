export type ThemeMode = "light" | "dark" | "system";
export type TaxMode = "none" | "single" | "gst" | "custom";

/** Single source of truth: keyed off the CURRENCIES registry in constants. */
import type { CurrencyCode } from "@/lib/constants";
export type { CurrencyCode };

export type InvoiceStatus =
  | "draft"
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue";

export type DocType = "invoice" | "quotation";

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