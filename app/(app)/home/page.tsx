"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useApp, useAppCurrency } from "@/lib/providers";
import { db } from "@/lib/db/database";
import { listInvoices } from "@/lib/db/invoices";
import { greetingForHour, formatMoney, formatDate } from "@/lib/formatting";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { Button } from "@/components/common/button";
import { Card, CardContent } from "@/components/common/card";
import { EmptyState } from "@/components/common/empty-state";
import { BrandLogo } from "@/components/common/brand-logo";
import { StatusBadge } from "@/components/invoice/status-badge";
import {
  Plus,
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  BellRing,
} from "lucide-react";

export default function HomePage() {
  const { business } = useApp();
  const currency = useAppCurrency();

  const invoices = useLiveQuery(() => listInvoices(), []) ?? [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) ?? [];

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const outstanding = invoices
    .filter((invoice) => deriveInvoiceStatus(invoice, now) !== "paid")
    .reduce((sum, invoice) => sum + invoice.payment.balance, 0);

  const invoicedThisMonth = invoices
    .filter((invoice) => invoice.invoiceDate.startsWith(monthKey))
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const collectedThisMonth = payments
    .filter((payment) => payment.date.startsWith(monthKey))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const recent = invoices.slice(0, 5);

  const outstandingInvoices = invoices
    .filter((inv) => {
      const st = deriveInvoiceStatus(inv, now);
      return st !== "paid" && inv.payment.balance > 0;
    })
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {greetingForHour()}
          </p>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            {business?.name || "Welcome back"}
          </h1>
        </div>
        <div className="hidden sm:block">
          <BrandLogo variant="mark" markClassName="h-11 w-11" />
        </div>
      </header>

      {/* Primary actions */}
      <section aria-label="Create invoice" className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/invoice/new"
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-brand-700 text-white shadow-sm transition-colors hover:bg-brand-800 active:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-950"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
          <span className="text-base font-semibold">New Invoice</span>
        </Link>
        <Link
          href="/invoice/new?mode=quick"
          className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white text-stone-900 shadow-sm transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800 dark:focus-visible:ring-offset-stone-950"
        >
          <Zap className="h-5 w-5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          <span className="text-base font-semibold">Quick Invoice</span>
        </Link>
      </section>

      {/* Summary */}
      <section aria-label="Summary" className="grid grid-cols-3 gap-3">
        <SummaryTile
          icon={TrendingUp}
          label="Outstanding"
          value={formatMoney(outstanding, currency)}
          hint={outstanding === 0 ? "You're all caught up." : "Unpaid balance"}
        />
        <SummaryTile
          icon={FileText}
          label="Invoiced this month"
          value={formatMoney(invoicedThisMonth, currency)}
          hint={invoicedThisMonth === 0 ? "No invoices yet" : "This month"}
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Paid this month"
          value={formatMoney(collectedThisMonth, currency)}
          hint={collectedThisMonth === 0 ? "No payments yet" : "This month"}
        />
      </section>

      {/* Outstanding invoices */}
      {outstanding > 0 && (
        <section aria-labelledby="outstanding-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="outstanding-heading"
              className="font-display text-lg font-bold tracking-tight text-stone-950 dark:text-white"
            >
              Outstanding
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              {outstandingInvoices.length}
            </span>
          </div>
          <Card>
            <CardContent className="divide-y divide-stone-100 p-2 dark:divide-stone-800">
              {outstandingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Link
                    href={`/invoice/view?id=${inv.id}`}
                    className="min-w-0 flex-1 rounded-xl"
                  >
                    <span className="block truncate text-sm font-semibold text-stone-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
                      {inv.invoiceNumber}
                    </span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      {inv.customerSnapshot.name || "Unknown customer"}
                      {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ""}
                    </span>
                  </Link>
                  <StatusBadge
                    status={deriveInvoiceStatus(inv, now)}
                    className="hidden sm:inline-flex"
                  />
                  <span className="shrink-0 text-sm font-semibold text-stone-900 dark:text-white">
                    {formatMoney(inv.payment.balance, currency)}
                  </span>
                  <Link
                    href={`/invoice/view?id=${inv.id}&reminder=1`}
                    title="Send reminder"
                    className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-brand-600 dark:hover:bg-stone-800 dark:hover:text-brand-300"
                  >
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">
                      Send reminder for {inv.invoiceNumber}
                    </span>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent invoices */}
      <section aria-labelledby="recent-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="recent-heading"
            className="font-display text-lg font-bold tracking-tight text-stone-950 dark:text-white"
          >
            Recent invoices
          </h2>
          <Link
            href="/invoices"
            className="flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" aria-hidden="true" />}
            title="Your first invoice is just a few taps away."
            description="No invoices yet. Create one in under a minute — no sign-up needed."
            action={
              <Link href="/invoice/new">
                <Button>Create your first invoice</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {recent.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoice/view?id=${invoice.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      {invoice.customerSnapshot.name || "Unknown customer"} ·{" "}
                      {formatDate(invoice.invoiceDate)}
                    </span>
                  </span>
                  <StatusBadge
                    status={deriveInvoiceStatus(invoice, now)}
                    className="hidden sm:inline-flex"
                  />
                  <span className="text-sm font-semibold text-stone-900 dark:text-white">
                    {formatMoney(invoice.total, currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
          <Icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          {label}
        </div>
        <p className="text-lg font-bold leading-tight tracking-tight text-stone-950 dark:text-white sm:text-xl">
          {value}
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500">{hint}</p>
      </CardContent>
    </Card>
  );
}