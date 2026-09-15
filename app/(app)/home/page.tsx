"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { useApp, useAppCurrency } from "@/lib/providers";
import { greetingForHour, formatMoney } from "@/lib/formatting";
import { Button } from "@/components/common/button";
import { Card, CardContent } from "@/components/common/card";
import { EmptyState } from "@/components/common/empty-state";
import { BrandLogo } from "@/components/common/brand-logo";
import { Plus, Zap, FileText, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const { business } = useApp();
  const currency = useAppCurrency();

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
          value={formatMoney(0, currency)}
          hint="You're all caught up."
        />
        <SummaryTile
          icon={FileText}
          label="Invoiced this month"
          value={formatMoney(0, currency)}
          hint="No invoices yet"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Paid this month"
          value={formatMoney(0, currency)}
          hint="No payments yet"
        />
      </section>

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
            <Wallet className="h-4 w-4" aria-hidden="true" />
            View all
          </Link>
        </div>

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