"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/common/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Invoicer app"
      className="fixed inset-x-3 bottom-24 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-white shadow-xl dark:border-white/10 print:hidden lg:bottom-6"
    >
      <Download className="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Install Invoicer</p>
        <p className="mt-0.5 truncate text-xs text-stone-400">
          Add it to your home screen. Works offline.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Install
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}