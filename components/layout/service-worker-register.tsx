"use client";

import { useEffect } from "react";

export const UPDATE_AVAILABLE = "invoicer:update-available";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((existing) => {
          if (existing) notifyOnUpdate(existing);
          return navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
          });
        })
        .then((reg) => reg && notifyOnUpdate(reg))
        .catch(() => {
          // Offline support is a nice-to-have; never break the app over it.
        });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

function notifyOnUpdate(reg: ServiceWorkerRegistration) {
  reg.addEventListener("updatefound", () => {
    const sw = reg.installing;
    if (!sw) return;
    sw.addEventListener("statechange", () => {
      if (sw.state !== "installed") return;
      if (navigator.serviceWorker.controller) {
        window.dispatchEvent(new Event(UPDATE_AVAILABLE));
      }
    });
  });
}