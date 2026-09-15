"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Users,
  Plus,
  MoreHorizontal,
  Settings,
  Package,
  Zap,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/common/button";
import { Sheet } from "@/components/common/sheet";
import { ThemeToggleIcon } from "@/components/common/theme-toggle";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { APP_NAME, PRIVACY_NOTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MORE_ITEMS = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function goNewInvoice(mode: "quick" | "standard") {
    setCreateOpen(false);
    router.push(mode === "quick" ? "/invoice/new?mode=quick" : "/invoice/new");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <OfflineBanner />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:flex">
          <div className="px-5 pb-4 pt-6">
            <Link href="/home" aria-label={`${APP_NAME} home`}>
              <BrandLogo variant="full" />
            </Link>
          </div>

          <div className="px-4 pb-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => goNewInvoice("standard")}
            >
              <Plus className="h-5 w-5" />
              New Invoice
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-3" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                    active
                      ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {APP_NAME}
              </p>
              <ThemeToggleIcon />
            </div>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {PRIVACY_NOTE}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 px-2">
          <NavLink href="/home" label="Home" icon={Home} active={isActive("/home")} />
          <NavLink
            href="/invoices"
            label="Invoices"
            icon={FileText}
            active={isActive("/invoices")}
          />
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create invoice"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition-transform active:scale-95"
            >
              <Plus aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <NavLink
            href="/customers"
            label="Customers"
            icon={Users}
            active={isActive("/customers")}
          />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      {/* Create sheet */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create invoice"
        description="Choose how you'd like to start."
      >
        <div className="space-y-2.5">
          <CreateOption
            icon={Zap}
            title="Quick Invoice"
            description="One item, one customer. Done in under 2 minutes."
            onClick={() => goNewInvoice("quick")}
          />
          <CreateOption
            icon={LayoutGrid}
            title="Standard Invoice"
            description="Full invoice with customers, items, taxes and payment."
            onClick={() => goNewInvoice("standard")}
          />
        </div>
      </Sheet>

      {/* More sheet */}
      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
      >
        <div className="space-y-2.5">
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <item.icon className="h-5 w-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
          <div className="pt-2">
            <p className="flex items-start gap-1.5 px-3 text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {PRIVACY_NOTE}
            </p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        active
          ? "text-brand-700 dark:text-brand-300"
          : "text-stone-500 dark:text-stone-400"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden={true} />
      {label}
    </Link>
  );
}

function CreateOption({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-stone-200 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/60 dark:border-stone-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
        <Icon className="h-5 w-5" aria-hidden={true} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-stone-950 dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
          {description}
        </span>
      </span>
    </button>
  );
}