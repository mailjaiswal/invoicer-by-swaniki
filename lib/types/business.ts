export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
}

export type LogoPosition = "left" | "center" | "right" | "none";

export interface Business {
  id: string;
  name: string;
  logo?: string | null;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  upiId?: string;
  bankDetails?: BankDetails;
  additionalInfo?: string;
  showUpiQr?: boolean;
  paymentInstructions?: string;
  logoPosition?: LogoPosition;
  createdAt: number;
  updatedAt: number;
}

export type BusinessDraft = Omit<Business, "id" | "createdAt" | "updatedAt">;