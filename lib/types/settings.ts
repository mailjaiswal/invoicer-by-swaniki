import type { CurrencyCode, ThemeMode, TaxMode } from "./misc";

export type InvoiceTemplateId = "modern" | "classic" | "compact";

export type InvoicePersonality = "professional" | "minimal" | "friendly";

export interface AppSettings {
  id: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceNumberPadding: number;
  currency: CurrencyCode;
  taxMode: TaxMode;
  defaultTax: number | null;
  defaultTerms: string;
  defaultTemplate: InvoiceTemplateId | string;
  defaultPaymentTermsDays: number;
  theme: ThemeMode;
  accentColor: string;
  personality?: InvoicePersonality;
  createdAt: number;
  updatedAt: number;
}