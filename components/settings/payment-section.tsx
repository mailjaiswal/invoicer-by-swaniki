"use client";

import { QrCode, Clock3 } from "lucide-react";
import { useApp } from "@/lib/providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Badge } from "@/components/common/badge";

export function PaymentSection() {
  const { business } = useApp();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Get paid faster — UPI QR on invoices, bank details and payment
          instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
            <QrCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-stone-900 dark:text-white">
                UPI
              </p>
              <Badge variant="warning">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                Next milestone
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              {business?.upiId
                ? `Your UPI ID (${business.upiId}) will power the invoice payment QR.`
                : "Add a UPI ID in Business details to get an invoice-specific payment QR."}
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-stone-400 dark:text-stone-500">
          Payment reminders, bank transfer details and UPI QR generation are
          planned for a later milestone. Invoicer works fully offline.
        </p>
      </CardContent>
    </Card>
  );
}