import type { InvoiceItem } from "./invoice";
import type { TaxBreakup, TaxMode } from "./misc";

export interface Preset {
  id: string;
  name: string;
  customerId?: string | null;
  customerSnapshot?: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstin?: string;
  };
  items: InvoiceItem[];
  taxMode: TaxMode;
  taxBreakup: TaxBreakup;
  template: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}