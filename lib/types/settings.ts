import type { CurrencyCode, ThemeMode, TaxMode } from "./misc";

export interface AppSettings {
  id: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceNumberPadding: number;
  currency: CurrencyCode;
  taxMode: TaxMode;
  defaultTax: number | null;
  defaultTerms: string;
  defaultTemplate: string;
  defaultPaymentTermsDays: number;
  theme: ThemeMode;
  accentColor: string;
  createdAt: number;
  updatedAt: number;
}