"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/common/input";
import { EmptyState } from "@/components/common/empty-state";

export default function CustomersPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
          Customers
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          The people and businesses you invoice.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
        <Input
          type="search"
          role="searchbox"
          aria-label="Search customers"
          placeholder="Search by name, company, email or phone"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <EmptyState
        icon={<Users className="h-7 w-7" aria-hidden="true" />}
        title="Customers you invoice regularly will appear here."
        description="No need to add one first — you can save a customer right when you create an invoice."
      />
    </div>
  );
}