"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  THEME_STORAGE_KEY,
  type CurrencyCode,
} from "@/lib/constants";
import {
  db,
  ensureDefaults,
  getSettings,
} from "@/lib/db/database";
import type { AppSettings, Business } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

export const useThemeScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY
)};var m=window.localStorage.getItem(k);var r=m==='dark'?'dark':m==='light'?'light':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',r==='dark');}catch(e){}})();`;

export type ThemeMode = "light" | "dark" | "system";

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface AppContextValue {
  business: Business | undefined;
  settings: AppSettings | undefined;
  hydrated: boolean;
  updateBusiness: (patch: Partial<Business>) => Promise<Business>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ------------------------------------------------------------------ */
/* Root provider stack                                                 */
/* ------------------------------------------------------------------ */

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>{children}</ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [read, setRead] = useState(false);

  if (!read && typeof window !== "undefined") {
    setRead(true);
    const initial = readStoredTheme();
    setThemeState(initial);
    applyTheme(initial);
  }

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function DataProvider({ children }: { children: ReactNode }) {
  const business = useLiveQuery(() => db.business.toArray(), []);
  const settings =
    useLiveQuery(() => db.settings.toArray(), []) ?? undefined;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    ensureDefaults()
      .then(() => getSettings())
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const account =
    business && business.length > 0 ? business[0] : undefined;
  const appSettings =
    settings && settings.length > 0 ? settings[0] : undefined;

  const updateBusiness = useCallback(async (patch: Partial<Business>) => {
    await db.transaction("rw", db.business, async () => {
      const existing = await db.business.get("default");
      const record = {
        id: "default",
        name: existing?.name ?? "",
        ...existing,
        ...patch,
        updatedAt: Date.now(),
        createdAt: existing?.createdAt ?? Date.now(),
      } as Business;
      await db.business.put(record);
    });
    return (await db.business.get("default")) as Business;
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const existing = (await getSettings()) ?? undefined;
    const record = {
      ...(existing as AppSettings),
      ...patch,
      id: "default",
      updatedAt: Date.now(),
    };
    await db.settings.put(record as AppSettings);
    return (await db.settings.get("default")) as AppSettings;
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      business: account,
      settings: appSettings,
      hydrated,
      updateBusiness,
      updateSettings,
    }),
    [account, appSettings, hydrated, updateBusiness, updateSettings]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timer.current[id]) {
      clearTimeout(timer.current[id]);
      delete timer.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = uid("toast");
      setToasts((prev) => [...prev, { id, message, type }]);
      timer.current[id] = setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
        role="region"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-lg backdrop-blur",
              "bg-white text-stone-900 dark:bg-stone-800 dark:text-stone-100",
              toast.type === "success" && "border-brand-200 dark:border-brand-800",
              toast.type === "error" && "border-red-200 dark:border-red-900",
              toast.type === "info" && "border-stone-200 dark:border-stone-700"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAppCurrency(): CurrencyCode {
  const { settings } = useApp();
  return settings?.currency ?? "INR";
}