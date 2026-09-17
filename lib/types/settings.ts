import type { CurrencyCode, ThemeMode, TaxMode } from "./misc";
import type { DocFontId } from "@/lib/constants";

export type InvoiceTemplateId = "modern" | "classic" | "compact" | "minimal" | "bold" | "elegant";

export type InvoicePersonality = "professional" | "minimal" | "friendly";

export type PageOrientation = "portrait" | "landscape";

export interface AppSettings {
  id: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceNumberPadding: number;
  /** Quotation numbering, independent of the invoice sequence (M15). */
  quotationPrefix?: string;
  nextQuotationNumber?: number;
  currency: CurrencyCode;
  taxMode: TaxMode;
  defaultTax: number | null;
  defaultTerms: string;
  defaultTemplate: InvoiceTemplateId | string;
  defaultPaymentTermsDays: number;
  theme: ThemeMode;
  accentColor: string;
  personality?: InvoicePersonality;
  docFont?: DocFontId;
  pageOrientation?: PageOrientation;
  notesLabel?: string;
  termsLabel?: string;
  createdAt: number;
  updatedAt: number;
}