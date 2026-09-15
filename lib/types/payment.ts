import type { PaymentMethod } from "./misc";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  createdAt: number;
}