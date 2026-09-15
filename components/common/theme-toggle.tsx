"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/providers";
import { SegmentedControl } from "@/components/common/segmented";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl<ThemeMode>
      aria-label="Theme"
      value={theme}
      onChange={setTheme}
      className={className}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  );
}

export function ThemeToggleIcon({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const resolved =
    theme === "system" &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:text-stone-400 dark:hover:bg-stone-800",
        className
      )}
      aria-label={
        resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {resolved === "dark" ? (
        <Sun aria-hidden="true" className="h-5 w-5" />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}