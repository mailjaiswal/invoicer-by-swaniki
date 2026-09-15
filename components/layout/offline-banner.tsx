"use client";

import { WifiOff } from "lucide-react";
import { useIsOffline } from "@/lib/hooks/use-is-offline";

export function OfflineBanner() {
  const offline = useIsOffline();

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-stone-200 bg-stone-100 px-4 py-2 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Offline — your invoices are still available on this device.</span>
    </div>
  );
}