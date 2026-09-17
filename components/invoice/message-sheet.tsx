"use client";

import * as React from "react";
import { Copy, MessageCircle } from "lucide-react";
import { Sheet } from "@/components/common/sheet";
import { Button } from "@/components/common/button";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney } from "@/lib/formatting";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { useToast } from "@/lib/providers";
import {
  buildInvoiceMessage,
  buildReminderMessage,
  buildWhatsAppUrl,
  copyText,
  INVOICE_MESSAGE_STYLES,
  REMINDER_MESSAGE_STYLES,
  type MessageContext,
  type ShareMessageStyle,
} from "@/lib/share";
import type { AppSettings, Business, Invoice } from "@/lib/types";

type MessageMode = "invoice" | "reminder";

interface MessageSheetProps {
  open: boolean;
  onClose: () => void;
  mode: MessageMode;
  invoice: Invoice;
  business?: Business;
  settings?: AppSettings;
}

/**
 * Compose a prefilled WhatsApp message for an invoice or a payment reminder.
 * Messages are never sent automatically — the user edits and shares (spec
 * §22, §23). Reminder mode also shows the outstanding amount and due date.
 */
export function MessageSheet({
  open,
  onClose,
  mode,
  invoice,
  business,
  settings,
}: MessageSheetProps) {
  const { showToast } = useToast();
  const currency = settings?.currency ?? "INR";
  const money = React.useCallback(
    (amount: number) => formatMoney(amount, currency),
    [currency]
  );
  const styles =
    mode === "reminder" ? REMINDER_MESSAGE_STYLES : INVOICE_MESSAGE_STYLES;
  const [style, setStyle] = React.useState<ShareMessageStyle>(
    mode === "reminder" ? "gentle_reminder" : "professional"
  );
  const [customMessage, setCustomMessage] = React.useState<string | null>(null);

  const template = React.useMemo(() => {
    const balance = invoice.payment.balance;
    const isReminder =
      mode === "reminder" ||
      (balance > 0 && deriveInvoiceStatus(invoice) !== "paid");
    const isQuotation = invoice.docType === "quotation";
    const ctx: MessageContext = {
      customerName: invoice.customerSnapshot.name?.trim() || "there",
      invoiceNumber: invoice.invoiceNumber,
      amount: money(isReminder && balance > 0 ? balance : invoice.total),
      dueDate: (isQuotation
        ? invoice.validityDate ?? invoice.dueDate
        : invoice.dueDate)
        ? formatDate(
            (isQuotation ? invoice.validityDate ?? invoice.dueDate : invoice.dueDate) ?? ""
          )
        : undefined,
      businessName: business?.name,
      docWord: isQuotation ? "quotation" : "invoice",
    };
    return mode === "reminder"
      ? buildReminderMessage(
          style as
            | "gentle_reminder"
            | "professional"
            | "short"
            | "final_reminder",
          ctx
        )
      : buildInvoiceMessage(
          style as "professional" | "friendly" | "short",
          ctx
        );
  }, [mode, style, invoice, business, money]);

  const message = customMessage ?? template;

  const selectStyle = (next: ShareMessageStyle) => {
    setStyle(next);
    setCustomMessage(null);
  };

  const handleCopy = async () => {
    const ok = await copyText(message.trim());
    showToast(
      ok ? "Message copied to clipboard." : "Couldn't copy the message.",
      ok ? "success" : "error"
    );
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppUrl(message.trim(), invoice.customerSnapshot.phone);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "reminder" ? "Send a reminder" : "Send via WhatsApp"}
      description={
        mode === "reminder"
          ? "A prefilled message for this unpaid invoice."
          : "A prefilled message for this invoice — edit it, then share."
      }
    >
      <div className="space-y-4">
        {mode === "reminder" && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm dark:border-stone-700 dark:bg-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">
                {invoice.invoiceNumber}
              </span>
              <span className="font-semibold text-stone-900 dark:text-white">
                {money(invoice.payment.balance)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Outstanding</span>
              <span>{invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : "Due date not set"}</span>
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">Style</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Message style">
            {styles.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectStyle(option.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  style === option.value
                    ? "bg-brand-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                )}
                aria-pressed={style === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="share-message" className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-stone-400">
            Message
          </label>
          <textarea
            id="share-message"
            rows={6}
            value={message}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-36 w-full resize-none rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          />
        </div>

        <p className="text-xs text-stone-400 dark:text-stone-500">
          Nothing is sent automatically — this opens WhatsApp with your message
          ready to go.
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleCopy}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Button className="flex-1" onClick={handleWhatsApp}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </Button>
        </div>
      </div>
    </Sheet>
  );
}