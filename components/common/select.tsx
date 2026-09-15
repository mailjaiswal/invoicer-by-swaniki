import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-stone-300 bg-white pl-3.5 pr-9 text-sm text-stone-950 shadow-sm transition-colors focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:[&>option]:bg-stone-900 dark:focus-visible:border-brand-500 dark:focus-visible:ring-brand-900",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
      aria-hidden="true"
    />
  </div>
));
Select.displayName = "Select";

export { Select };