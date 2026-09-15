"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/common/brand-logo";
import { APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onDone?: () => void;
  redirecting?: boolean;
}

export function SplashScreen({ onDone, redirecting }: SplashScreenProps) {
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(() => setCanProceed(true), 1100);
    return () => clearTimeout(t);
  }, [onDone]);

  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-stone-50 px-6 dark:bg-stone-950">
      <div className="flex flex-col items-center text-center">
        <BrandMark className="h-20 w-20 animate-fade-up" />
        <h1
          className="mt-6 font-display text-3xl font-bold tracking-tight text-stone-950 dark:text-white animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          Invoicer
        </h1>
        <p
          className="mt-1 text-sm font-medium tracking-wide text-brand-600 dark:text-brand-300 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          by Swaniki
        </p>
        <p
          className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          {APP_TAGLINE}
        </p>
      </div>

      <div
        className={cn("absolute bottom-14 animate-fade-in", !canProceed && "hidden")}
      >
        {onDone && !redirecting && (
          <button
            type="button"
            onClick={onDone}
            className="flex h-12 items-center gap-2 rounded-full bg-brand-700 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}