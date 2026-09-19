import type {
  DocType,
  InvoiceStatus,
  PaymentMethod,
  TaxBreakup,
  TaxMode,
  TaxType,
} from "./misc";

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  comments?: string;
  /** How often this line repeats, e.g. "One-time", "Monthly". */
  frequency?: string;
  quantity: number;
  unit: string;
  rate: number;
  taxType: TaxType;
  taxRate: number;
  discount: number;
  lineTotal: number;
}

export interface CustomerSnapshot {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

export interface PaymentDetails {
  status: "unpaid" | "partial" | "paid";
  amountPaid: number;
  balance: number;
  method?: PaymentMethod;
  paidAt?: number;
  reference?: string;
}

export interface Invoice {
  id: string;
  docType: DocType;
  invoiceNumber: string;
  customerId?: string | null;
  customerSnapshot: CustomerSnapshot;
  items: InvoiceItem[];
  invoiceDate: string;
  dueDate?: string | null;
  /** Quotation-only: last date the quoted price is valid (vs dueDate). */
  validityDate?: string | null;
  subtotal: number;
  discount: number;
  taxMode: TaxMode;
  taxBreakup: TaxBreakup;
  taxableAmount: number;
  taxTotal: number;
  total: number;
  payment: PaymentDetails;
  notes?: string;
  terms?: string;
  template: string;
  createdAt: number;
  updatedAt: number;
  status: InvoiceStatus;
}

export type InvoiceDraft = Omit<Invoice, "id" | "createdAt" | "updatedAt" | "status">;