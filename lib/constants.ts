export const APP_NAME = "Invoicer by Swaniki";
export const APP_SHORT_NAME = "Invoicer by Swaniki";
export const APP_TAGLINE = "Create. Share. Get Paid.";
export const APP_DESCRIPTION =
  "Invoicer by Swaniki is a private, local-first invoice maker for freelancers, consultants and small businesses. Create professional invoices, share them and get paid — no sign-up, no cloud, your data stays on your device.";

export const DB_NAME = "invoicer-by-swaniki";
export const DB_VERSION = 1;

export const BUSINESS_ID = "default";
export const SETTINGS_ID = "default";

export const THEME_STORAGE_KEY = "invoicer:theme";
export const ONBOARDING_SEEN_KEY = "invoicer:onboarding-seen";

export const PRIVACY_NOTE =
  "Your invoice data stays on this device unless you choose to export or share it.";

export const TAX_DISCLAIMER =
  "Invoicer by Swaniki helps create invoices; it is not a tax filing or accounting system.";

export const CURRENCIES = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN" },
  USD: { code: "USD", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB" },
  AED: { code: "AED", symbol: "AED", locale: "en-AE" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_SETTINGS = {
  invoicePrefix: "INV",
  nextInvoiceNumber: 1,
  currency: "INR",
  taxMode: "none",
  defaultTax: null,
  defaultTerms: "",
  defaultTemplate: "modern",
  defaultPaymentTermsDays: 15,
} as const;

/** Invoice layouts the document engine can render (spec §16). */
export const INVOICE_TEMPLATES = [
  {
    id: "modern",
    label: "Modern",
    blurb: "Card-based, clean and current.",
  },
  {
    id: "classic",
    label: "Classic",
    blurb: "Traditional rule and serif-style formality.",
  },
  {
    id: "compact",
    label: "Compact",
    blurb: "Dense and minimal — fits a lot on one page.",
  },
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATES)[number]["id"];

/** Lightweight visual treats applied on top of a template (spec §17). */
export const INVOICE_PERSONALITIES = [
  { id: "professional", label: "Professional", blurb: "Neutral, exact, businesslike." },
  { id: "minimal", label: "Minimal", blurb: "Less ink, more air." },
  { id: "friendly", label: "Friendly", blurb: "Warmer heading color and a thank-you note." },
] as const;

export type InvoicePersonality = (typeof INVOICE_PERSONALITIES)[number]["id"];

/** Where the logo sits on the invoice (spec §18). */
export const LOGO_POSITIONS = [
  { id: "left", label: "Top left" },
  { id: "center", label: "Top centre" },
  { id: "right", label: "Top right" },
  { id: "none", label: "No logo" },
] as const;

export type LogoPosition = (typeof LOGO_POSITIONS)[number]["id"];

/** Restrained accent palette (spec §34 — no visual chaos). */
export const ACCENT_COLOR_SWATCHES = [
  "#1a6553",
  "#2563eb",
  "#7c3aed",
  "#0e7490",
  "#b45309",
  "#dc2626",
  "#db2777",
  "#374151",
] as const;

export const DEFAULT_ACCENT_COLOR = "#1a6553";