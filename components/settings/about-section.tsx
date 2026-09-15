"use client";

import { ShieldCheck, Scale } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { PRIVACY_NOTE, TAX_DISCLAIMER, APP_NAME, APP_TAGLINE } from "@/lib/constants";

const VERSION = "0.1.0";

export function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About {APP_NAME}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {PRIVACY_NOTE} No account, no analytics on your invoices, no cloud
            sync.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {TAX_DISCLAIMER}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500 dark:bg-stone-800/60 dark:text-stone-400">
          <p className="font-semibold text-stone-900 dark:text-white">
            {APP_NAME}
          </p>
          <p className="mt-0.5">{APP_TAGLINE}</p>
          <p className="mt-1 text-xs">Version {VERSION} · Local-first</p>
        </div>
      </CardContent>
    </Card>
  );
}