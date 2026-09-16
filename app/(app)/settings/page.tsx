"use client";

import { useState } from "react";
import {
  UserRound,
  MonitorCog,
  QrCode,
  DatabaseBackup,
  Info,
  Building2,
} from "lucide-react";
import { BusinessForm } from "@/components/settings/business-form";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { PaymentSection } from "@/components/settings/payment-section";
import { DataSection } from "@/components/settings/data-section";
import { AboutSection } from "@/components/settings/about-section";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "appearance", label: "Appearance", icon: MonitorCog },
  { id: "payment", label: "Payment", icon: QrCode },
  { id: "data", label: "Data & Backup", icon: DatabaseBackup },
  { id: "about", label: "About", icon: Info },
] as const;

type TabId = (typeof TABS)[number]["id"];

const HEADINGS: Record<TabId, { title: string; subtitle: string }> = {
  business: {
    title: "Business details",
    subtitle: "Shown at the top of your invoices. Change anytime.",
  },
  appearance: {
    title: "Appearance",
    subtitle: "Make Invoicer by Swaniki feel like yours.",
  },
  payment: {
    title: "Get paid",
    subtitle: "Payment options for your invoices.",
  },
  data: {
    title: "Data & backup",
    subtitle: "Your data is local. Keep it safe your way.",
  },
  about: {
    title: "About",
    subtitle: "What Invoicer by Swaniki is — and isn't.",
  },
};

export default function SettingsPage() {
  const { business } = useApp();
  const [tab, setTab] = useState<TabId>("business");
  const heading = HEADINGS[tab];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Business profile, appearance, backups.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden" role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              tab === t.id
                ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Settings sections">
          <nav className="sticky top-24 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                  tab === t.id
                    ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                )}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <section aria-labelledby="settings-heading" className="min-w-0 space-y-5">
          <div>
            <h2
              id="settings-heading"
              className="font-display text-lg font-bold tracking-tight text-stone-950 dark:text-white"
            >
              {heading.title}
            </h2>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              {heading.subtitle}
            </p>
          </div>

          {tab === "business" && (
            <div className="flex items-start gap-2.5 text-xs text-stone-400 dark:text-stone-500">
              <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <p>
                Only what you enter appears on your invoices. Nothing is sent
                anywhere — everything is stored in your browser&apos;s local
                database on this device.
              </p>
            </div>
          )}

          {tab === "business" && (
            <BusinessForm
              key={business ? `business-${business.updatedAt}` : "business-pending"}
              initial={business}
            />
          )}
          {tab === "appearance" && <AppearanceSection />}
          {tab === "payment" && <PaymentSection />}
          {tab === "data" && <DataSection />}
          {tab === "about" && <AboutSection />}
        </section>
      </div>
    </div>
  );
}