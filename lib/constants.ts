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