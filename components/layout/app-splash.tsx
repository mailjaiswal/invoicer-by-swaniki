"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/common/brand-logo";
import { cn } from "@/lib/utils";

type Phase = "show" | "hide" | "gone";

export function AppSplash() {
  const [phase, setPhase] = useState<Phase>("show");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const delay = prefersReduced ? 0 : 700;
    const fade = window.setTimeout(() => setPhase("hide"), delay);
    const remove = window.setTimeout(() => setPhase("gone"), delay + 400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden={phase === "hide"}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-stone-50 transition-opacity duration-300 dark:bg-stone-950 print:hidden",
        phase === "hide" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <BrandMark className="h-16 w-16 animate-fade-up" />
      <div
        className="animate-fade-up text-center"
        style={{ animationDelay: "90ms" }}
      >
        <p className="font-display text-lg font-bold tracking-tight text-stone-950 dark:text-white">
          Invoicer
        </p>
        <p className="mt-0.5 text-sm font-medium tracking-wide text-stone-500 dark:text-stone-400">
          by Swaniki
        </p>
      </div>
    </div>
  );
}