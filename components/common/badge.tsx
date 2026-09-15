import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
        success: "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
        solid: "bg-brand-700 text-white",
        outline: "border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };