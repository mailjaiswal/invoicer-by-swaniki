import { useEffect, useState } from "react";

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = () => setOffline(!navigator.onLine);
    apply();

    window.addEventListener("online", apply);
    window.addEventListener("offline", apply);

    let cancelled = false;

    const runProbe = async () => {
      try {
        const res = await fetch(
          `${window.location.origin}/manifest.webmanifest?probe=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!cancelled) setOffline(!res.ok);
      } catch {
        if (!cancelled) setOffline(true);
      }
    };

    const poll = setInterval(runProbe, 30_000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", apply);
      window.removeEventListener("offline", apply);
      clearInterval(poll);
    };
  }, []);

  return offline;
}