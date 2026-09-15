"use client";

import { Suspense, type ComponentType, type SVGProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, LayoutGrid, Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/button";
import { EmptyState } from "@/components/common/empty-state";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<BuilderFallback />}>
      <Builder />
    </Suspense>
  );
}

function BuilderFallback() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
        New Invoice
      </h1>
    </div>
  );
}

function Builder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "quick" ? "quick" : "standard";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            {mode === "quick" ? "Quick Invoice" : "New Invoice"}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Create. Share. Get Paid.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeTile
          icon={Zap}
          title="Quick Invoice"
          description="One customer, one item. Less than 2 minutes."
          active={mode === "quick"}
          onClick={() => router.replace("/invoice/new?mode=quick")}
        />
        <ModeTile
          icon={LayoutGrid}
          title="Standard Invoice"
          description="Full builder — items, taxes, payment and template."
          active={mode === "standard"}
          onClick={() => router.replace("/invoice/new")}
        />
      </div>

      <EmptyState
        icon={<Construction className="h-7 w-7" aria-hidden="true" />}
        title="The invoice builder is next up."
        description="Milestone 1 is the foundation — app shell, offline support and your business profile. The full build-and-share invoice flow arrives in the next milestone."
        action={
          <Button variant="secondary" onClick={() => router.push("/settings")}>
            Set up business details
          </Button>
        }
      />
    </div>
  );
}

function ModeTile({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors"
      aria-pressed={active}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-stone-950 dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
          {description}
        </span>
      </span>
    </button>
  );
}