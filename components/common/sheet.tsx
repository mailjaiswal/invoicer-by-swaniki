"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center print:hidden">
      <button
        aria-label="Close"
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Sheet"}
        className={cn(
          "relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900",
          "sm:max-w-md sm:rounded-2xl",
          "animate-[sheetUp_0.2s_ease-out] sm:animate-none"
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300 sm:hidden dark:bg-stone-700" />
        {title && (
          <div className="flex items-start justify-between px-5 pb-2 pt-4">
            <div>
              {title && (
                <h2 className="text-base font-semibold text-stone-950 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-6 pt-2">{children}</div>
      </div>
      <style jsx>{`
        @keyframes sheetUp {
          from {
            transform: translateY(24px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}