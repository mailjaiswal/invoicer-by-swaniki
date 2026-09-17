"use client";

import { ShieldCheck, Scale, Gavel } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { PRIVACY_NOTE, TAX_DISCLAIMER, LEGAL_DISCLAIMER, APP_NAME, APP_TAGLINE } from "@/lib/constants";

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
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-900/20">
          <div className="flex items-start gap-2.5">
            <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">
                Not legal advice
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {LEGAL_DISCLAIMER}
              </p>
            </div>
          </div>
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