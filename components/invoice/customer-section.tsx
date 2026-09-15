"use client";

import { useMemo, useState } from "react";
import { Check, Search, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Switch } from "@/components/common/switch";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";
import type { BuilderCustomer } from "./builder-utils";

interface CustomerSectionProps {
  mode: "quick" | "standard";
  customer: BuilderCustomer;
  customerId: string | null;
  saveCustomer: boolean;
  customers: Customer[];
  onChange: (patch: Partial<BuilderCustomer>) => void;
  onSelectExisting: (customer: Customer | null) => void;
  onSaveToggle: (saved: boolean) => void;
}

export function CustomerSection({
  mode,
  customer,
  customerId,
  saveCustomer,
  customers,
  onChange,
  onSelectExisting,
  onSaveToggle,
}: CustomerSectionProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return customers
      .filter((item) =>
        [item.name, item.company ?? "", item.email ?? ""].some((field) =>
          field.toLowerCase().includes(needle)
        )
      )
      .slice(0, 6);
  }, [query, customers]);

  const showDropdown = query.trim().length > 0 && !customerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
        <CardDescription>
          {mode === "quick"
            ? "One customer for this invoice."
            : "Pick a saved customer or add a new one."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "standard" && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400"
              aria-hidden="true"
            />
            <Input
              placeholder="Search your customers"
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {customerId && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 dark:border-brand-900 dark:bg-brand-900/30">
                <UserRound
                  className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {customer.name}
                  </span>
                  {!!customer.email && (
                    <span className="block truncate text-xs text-stone-500">
                      {customer.email}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectExisting(null);
                    setQuery("");
                  }}
                  className="shrink-0 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  Change
                </button>
              </div>
            )}
            {showDropdown && (
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-900">
                {matches.length === 0 ? (
                  <p className="px-3 py-2.5 text-sm text-stone-500">
                    No customers match “{query.trim()}”. Type the details below
                    to add a new one.
                  </p>
                ) : (
                  matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectExisting(item);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <UserRound
                        className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                          {item.name}
                        </span>
                        {!!item.company && (
                          <span className="block truncate text-xs text-stone-500">
                            {item.company}
                          </span>
                        )}
                      </span>
                      <Check
                        className="h-4 w-4 text-brand-600"
                        aria-hidden="true"
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="customer-name">
              Customer name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customer-name"
              placeholder="e.g. Aarav Kapoor"
              value={customer.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          {mode === "standard" && (
            <div>
              <Label htmlFor="customer-company">Company</Label>
              <Input
                id="customer-company"
                placeholder="Acme Studio"
                value={customer.company ?? ""}
                onChange={(e) =>
                  onChange({ company: e.target.value || undefined })
                }
              />
            </div>
          )}
          <div>
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="hello@example.in"
              value={customer.email ?? ""}
              onChange={(e) =>
                onChange({ email: e.target.value || undefined })
              }
            />
          </div>
          <div>
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              placeholder="+91 90000 00000"
              value={customer.phone ?? ""}
              onChange={(e) =>
                onChange({ phone: e.target.value || undefined })
              }
            />
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-2.5 dark:border-stone-700"
          )}
        >
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Save this customer
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Skip re-typing their details next time.
            </p>
          </div>
          <Switch
            checked={saveCustomer}
            onCheckedChange={onSaveToggle}
            id="save-customer"
            aria-label="Save this customer for next time"
          />
        </div>
      </CardContent>
    </Card>
  );
}