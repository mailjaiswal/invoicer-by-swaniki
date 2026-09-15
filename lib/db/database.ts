import Dexie, { type Table } from "dexie";
import {
  BUSINESS_ID,
  DB_NAME,
  DB_VERSION,
  DEFAULT_SETTINGS,
  SETTINGS_ID,
} from "@/lib/constants";
import type {
  AppSettings,
  Business,
  Customer,
  Invoice,
  Payment,
  Preset,
  Product,
} from "@/lib/types";

export class InvoiceDatabase extends Dexie {
  business!: Table<Business, string>;
  settings!: Table<AppSettings, string>;
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  presets!: Table<Preset, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      business: "id",
      settings: "id",
      customers: "id, name, createdAt",
      products: "id, name, createdAt",
      invoices: "id, invoiceNumber, status, invoiceDate, dueDate, customerId, total, createdAt",
      payments: "id, invoiceId, date",
      presets: "id, name, createdAt",
    });
  }
}

export const db = new InvoiceDatabase();

export class DataError extends Error {}

export function now(): number {
  return Date.now();
}

export async function getBusiness(): Promise<Business | undefined> {
  return db.business.get(BUSINESS_ID);
}

export async function saveBusiness(
  patch: Partial<Business>
): Promise<Business> {
  const existing = await getBusiness();
  const timestamp = now();
  const record: Business = {
    id: BUSINESS_ID,
    name: "",
    ...existing,
    ...patch,
    updatedAt: timestamp,
    createdAt: existing?.createdAt ?? timestamp,
  };
  await db.business.put(record);
  return record;
}

export function defaultSettings(): AppSettings {
  const timestamp = now();
  return {
    id: SETTINGS_ID,
    invoicePrefix: DEFAULT_SETTINGS.invoicePrefix,
    nextInvoiceNumber: DEFAULT_SETTINGS.nextInvoiceNumber,
    invoiceNumberPadding: 4,
    currency: DEFAULT_SETTINGS.currency,
    taxMode: DEFAULT_SETTINGS.taxMode,
    defaultTax: DEFAULT_SETTINGS.defaultTax,
    defaultTerms: DEFAULT_SETTINGS.defaultTerms,
    defaultTemplate: DEFAULT_SETTINGS.defaultTemplate,
    defaultPaymentTermsDays: DEFAULT_SETTINGS.defaultPaymentTermsDays,
    theme: "system",
    accentColor: "#1a6553",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  const fresh = defaultSettings();
  await db.settings.put(fresh);
  return fresh;
}

export async function saveSettings(
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  const existing = (await getSettings()) ?? defaultSettings();
  const record: AppSettings = {
    ...existing,
    ...patch,
    id: SETTINGS_ID,
    updatedAt: now(),
  };
  await db.settings.put(record);
  return record;
}

export async function ensureDefaults(): Promise<void> {
  await getSettings();
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.business.clear(),
    db.settings.clear(),
    db.customers.clear(),
    db.products.clear(),
    db.invoices.clear(),
    db.payments.clear(),
    db.presets.clear(),
  ]);
  await getSettings();
}