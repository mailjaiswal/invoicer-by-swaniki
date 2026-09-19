export interface Product {
  id: string;
  name: string;
  description?: string;
  rate: number;
  taxRate?: number | null;
  createdAt: number;
  updatedAt: number;
}

export type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt">;