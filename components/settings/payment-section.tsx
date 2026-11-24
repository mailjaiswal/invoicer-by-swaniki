"use client";

import * as React from "react";
import { QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Badge } from "@/components/common/badge";
import { isValidUpiId, buildUpiUrl } from "@/lib/upi";
import { UpiQr } from "@/components/invoice/upi-qr";

export function PaymentSection() {
  const { business } = useApp();
  const upiId = business?.upiId?.trim();
  const valid = !!upiId && isValidUpiId(upiId);
  const showQr = business?.showUpiQr !== false;

  const sampleUrl = valid
    ? buildUpiUrl({
        id: upiId,
        name: business?.name,
        note: "Invoice Payment",
      })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment &amp; UPI</CardTitle>
        <CardDescription>
          Get paid faster with instant UPI QR codes on all your invoices. Generated 100% offline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-900/40">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-stone-900 dark:text-white">
                  UPI Instant Payments
                </p>
                {valid ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                ) : upiId ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Invalid format
                  </Badge>
                ) : (
                  <Badge variant="outline">Not configured</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {valid
                  ? showQr
                    ? `Configured with ${upiId}. Dynamic QR code with invoice amount will automatically appear on invoices and PDF downloads.`
                    : `Configured with ${upiId}, but QR code generation is currently disabled in Business details.`
                  : upiId
                  ? "The UPI ID provided does not match standard handle format (e.g. name@bank or phone@upi)."
                  : "Enter your UPI VPA / ID under Business details above to enable instant scannable payment codes."}
              </p>
            </div>
          </div>

          {valid && showQr && sampleUrl && (
            <div className="shrink-0 self-center sm:self-auto flex flex-col items-center">
              <UpiQr value={sampleUrl} size={84} />
              <span className="mt-1 text-[10px] text-stone-400">Preview</span>
            </div>
          )}
        </div>

        <p className="text-xs leading-relaxed text-stone-400 dark:text-stone-500">
          Customers can scan the QR code using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
          All payments go directly to your linked bank account with zero middleman or processing fees.
        </p>
      </CardContent>
    </Card>
  );
}
