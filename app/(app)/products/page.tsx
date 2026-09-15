"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/common/input";
import { EmptyState } from "@/components/common/empty-state";

export default function ProductsPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
          Products &amp; Services
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Save frequently used services so invoicing takes seconds.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
        <Input
          type="search"
          role="searchbox"
          aria-label="Search products and services"
          placeholder="Search by name or description"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <EmptyState
        icon={<Package className="h-7 w-7" aria-hidden="true" />}
        title="No products or services yet."
        description="Save frequently used services to create invoices faster. Defaults fill in automatically and stay editable."
      />
    </div>
  );
}