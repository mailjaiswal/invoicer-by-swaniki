export interface Product {
  id: string;
  name: string;
  description?: string;
  /** Optional billing cadence shown on linked invoice lines (e.g. "Monthly", "One-time"). */
  frequency?: string;
  rate: number;
  taxRate?: number | null;
  createdAt: number;
  updatedAt: number;
}

export type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt">;