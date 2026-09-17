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

/** Legal boundaries, shown prominently in Settings → About. */
export const LEGAL_DISCLAIMER =
  "Invoicer by Swaniki does not touch the legal, tax or accounting framework of your country. Invoice rules — taxes, GST/VAT, language, records and official formats — vary by jurisdiction, so please double-check everything you publish, send or file before you go live.";

/** Symbol/text that differentiates a currency in the PDF. Robin (Roboto) is
    the PDF's bundled font and covers ₹, $, €, £, ¥, ₩, ₺, ₽ and ₫. */
export const CURRENCIES = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", digits: 2 },
  USD: { code: "USD", symbol: "$", locale: "en-US", digits: 2 },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE", digits: 2 },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", digits: 2 },
  AED: { code: "AED", symbol: "AED", locale: "en-AE", digits: 2 },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU", digits: 2 },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA", digits: 2 },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG", digits: 2 },
  CHF: { code: "CHF", symbol: "CHF", locale: "de-CH", digits: 2 },
  CNY: { code: "CNY", symbol: "CN¥", locale: "zh-CN", digits: 2 },
  HKD: { code: "HKD", symbol: "HK$", locale: "zh-HK", digits: 2 },
  JPY: { code: "JPY", symbol: "¥", locale: "ja-JP", digits: 0 },
  KRW: { code: "KRW", symbol: "₩", locale: "ko-KR", digits: 0 },
  IDR: { code: "IDR", symbol: "Rp", locale: "id-ID", digits: 0 },
  VND: { code: "VND", symbol: "₫", locale: "vi-VN", digits: 0 },
  MYR: { code: "MYR", symbol: "RM", locale: "ms-MY", digits: 2 },
  NZD: { code: "NZD", symbol: "NZ$", locale: "en-NZ", digits: 2 },
  PHP: { code: "PHP", symbol: "₱", locale: "en-PH", digits: 2 },
  TRY: { code: "TRY", symbol: "₺", locale: "tr-TR", digits: 2 },
  RUB: { code: "RUB", symbol: "₽", locale: "ru-RU", digits: 2 },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA", digits: 2 },
  BRL: { code: "BRL", symbol: "R$", locale: "pt-BR", digits: 2 },
  MXN: { code: "MXN", symbol: "MX$", locale: "es-MX", digits: 2 },
  QAR: { code: "QAR", symbol: "QR", locale: "en-QA", digits: 2 },
  SAR: { code: "SAR", symbol: "SAR", locale: "ar-SA", digits: 2 },
  LKR: { code: "LKR", symbol: "Rs", locale: "en-LK", digits: 2 },
  NPR: { code: "NPR", symbol: "Rs", locale: "en-NP", digits: 2 },
  PKR: { code: "PKR", symbol: "Rs", locale: "en-PK", digits: 2 },
  PLN: { code: "PLN", symbol: "zł", locale: "pl-PL", digits: 2 },
  CZK: { code: "CZK", symbol: "Kč", locale: "cs-CZ", digits: 2 },
  HUF: { code: "HUF", symbol: "Ft", locale: "hu-HU", digits: 0 },
  SEK: { code: "SEK", symbol: "kr", locale: "sv-SE", digits: 2 },
  NOK: { code: "NOK", symbol: "kr", locale: "nb-NO", digits: 2 },
  DKK: { code: "DKK", symbol: "kr", locale: "da-DK", digits: 2 },
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
  docFont: "roboto",
  pageOrientation: "portrait",
  notesLabel: "Notes",
  termsLabel: "Terms",
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
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Whitespace, thin rules and unadorned type.",
  },
  {
    id: "bold",
    label: "Bold",
    blurb: "Strong accents, heavy type and confident headlines.",
  },
  {
    id: "elegant",
    label: "Elegant",
    blurb: "Refined serif feel with a subtle double-rule masthead.",
  },
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATES)[number]["id"];

/** Document fonts available for the invoice (screen + PDF). Each ships a
    static TTF in /public/fonts so nothing depends on a CDN and the PDF can
    embed them offline. 'roboto' is the bundled pdfmake font. */
export const DOC_FONTS = [
  { id: "roboto", label: "Roboto", blurb: "The bundled default — clean and does not weigh the PDF.", weights: 1 },
  { id: "poppins", label: "Poppins", blurb: "Friendly, geometric sans — great for modern invoices.", weights: 2 },
  { id: "tinos", label: "Tinos", blurb: "A classic, serif-like book face for a traditional look.", weights: 2 },
] as const;

export type DocFontId = (typeof DOC_FONTS)[number]["id"];

/** CSS font-family stacks for each doc font family ("" = inherited default). */
export const FONT_STACKS: Record<DocFontId, string> = {
  roboto: "",
  poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
  tinos: "Tinos, Georgia, 'Times New Roman', serif",
};

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