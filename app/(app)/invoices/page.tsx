"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, FileText, Plus } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
          Invoices
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Track, duplicate and share your invoices.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <Input
            type="search"
            role="searchbox"
            aria-label="Search invoices"
            placeholder="Search by invoice number or customer"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                status === filter.value
                  ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <EmptyState
        icon={<FileText className="h-7 w-7" aria-hidden="true" />}
        title="No invoices yet."
        description={
          query || status !== "all"
            ? "Nothing matches your search right now."
            : "Create your first invoice in under a minute."
        }
        action={
          query || status !== "all" ? (
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Link href="/invoice/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create invoice
              </Button>
            </Link>
          )
        }
      />
    </div>
  );
}