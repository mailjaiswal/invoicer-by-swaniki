"use client";

import { MonitorCog } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";

export function AppearanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Pick how Invoicer by Swaniki looks on this device. Invoices and PDFs
          always use a professional white document background.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
            <MonitorCog className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Theme</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Follow your device or pick one.
            </p>
          </div>
        </div>
        <ThemeToggle />
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Your theme preference is stored on this device only.
        </p>
      </CardContent>
    </Card>
  );
}