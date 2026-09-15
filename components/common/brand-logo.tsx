import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-9 w-9", className)}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#1A6553" />
      <path
        d="M13 12h13l7 7v17a2.5 2.5 0 0 1-2.5 2.5H15.5A2.5 2.5 0 0 1 13 36V14.5A2.5 2.5 0 0 1 15.5 12H13Z"
        fill="#ffffff"
      />
      <path
        d="M26 12v7h7"
        fill="none"
        stroke="#1A6553"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="17" y="22.5" width="10" height="2.2" rx="1.1" fill="#1A6553" />
      <rect x="17" y="28" width="14" height="2.2" rx="1.1" fill="#1A6553" />
      <rect x="17" y="33.5" width="8" height="2.2" rx="1.1" fill="#1A6553" />
    </svg>
  );
}

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  variant?: "full" | "stack" | "mark";
}

export function BrandLogo({
  className,
  markClassName,
  variant = "full",
}: BrandLogoProps) {
  if (variant === "mark") {
    return <BrandMark className={markClassName} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark className={cn("h-9 w-9", markClassName)} />
      {variant === "full" && (
        <div className="leading-none">
          <p className="font-display text-[17px] font-bold tracking-tight text-stone-950 dark:text-white">
            Invoicer
          </p>
          <p className="mt-0.5 text-[12px] font-medium tracking-wide text-stone-500 dark:text-stone-400">
            by Swaniki
          </p>
        </div>
      )}
      {variant === "stack" && (
        <div className="flex flex-col leading-none">
          <p className="font-display text-[17px] font-bold tracking-tight text-stone-950 dark:text-white">
            Invoicer
          </p>
          <p className="mt-0.5 text-[12px] font-medium tracking-wide text-brand-600 dark:text-brand-300">
            by Swaniki
          </p>
        </div>
      )}
    </div>
  );
}