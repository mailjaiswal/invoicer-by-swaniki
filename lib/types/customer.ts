export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type CustomerDraft = Omit<Customer, "id" | "createdAt" | "updatedAt">;