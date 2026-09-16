"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/common/button";
import { UPDATE_AVAILABLE } from "@/components/layout/service-worker-register";

export function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    function show() {
      setAvailable(true);
    }

    window.addEventListener(UPDATE_AVAILABLE, show);
    return () => window.removeEventListener(UPDATE_AVAILABLE, show);
  }, []);

  if (!available) return null;

  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) reg.waiting.postMessage("SKIP_WAITING");
    });
    window.location.reload();
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:border-brand-900 dark:bg-brand-900/50 dark:text-brand-200">
      <span>A new version is ready.</span>
      <Button size="sm" variant="secondary" onClick={applyUpdate}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Update now
      </Button>
    </div>
  );
}