"use client";

import { useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Textarea } from "@/components/common/textarea";
import { Select } from "@/components/common/select";
import { Button } from "@/components/common/button";
import { Sheet } from "@/components/common/sheet";
import { calcLine } from "@/lib/calculations";
import { formatMoney } from "@/lib/formatting";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { uid } from "@/lib/utils";
import type { Product, TaxType } from "@/lib/types";
import { isTaxType, type BuilderLine } from "./builder-utils";

const TAX_OPTIONS: Array<{ value: TaxType; label: string }> = [
  { value: "none", label: "No tax" },
  { value: "percentage", label: "Percentage" },
  { value: "gst_igst", label: "IGST" },
  { value: "gst_cgst_sgst", label: "CGST + SGST" },
];

interface ItemsEditorProps {
  mode: "quick" | "standard";
  items: BuilderLine[];
  products: Product[];
  currency: CurrencyCode;
  onChange: (items: BuilderLine[]) => void;
}

export function ItemsEditor({
  mode,
  items,
  products,
  currency,
  onChange,
}: ItemsEditorProps) {
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const symbol = CURRENCIES[currency]?.symbol ?? CURRENCIES.INR.symbol;

  const updateLine = (id: string, patch: Partial<BuilderLine>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeLine = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((item) => item.id !== id));
  };

  const addLine = (line?: Partial<BuilderLine>) => {
    onChange([
      ...items,
      {
        id: uid("item"),
        name: "",
        quantity: 1,
        unit: "",
        rate: 0,
        discount: 0,
        taxType: "none",
        taxRate: 0,
        ...line,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>
              {mode === "quick" ? "Item" : "Items"}
            </CardTitle>
            <CardDescription>
              {mode === "quick"
                ? "One line for this invoice."
                : "Line items with optional discount and tax."}
            </CardDescription>
          </div>
          {mode === "standard" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductSheetOpen(true)}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              From products
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            line={item}
            symbol={symbol}
            currency={currency}
            showRemove={mode === "standard" && items.length > 1}
            onUpdate={(patch) => updateLine(item.id, patch)}
            onRemove={() => removeLine(item.id)}
          />
        ))}
        {mode === "standard" && (
          <Button variant="secondary" className="w-full" onClick={() => addLine()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add item
          </Button>
        )}
      </CardContent>

      <Sheet
        open={productSheetOpen}
        onClose={() => setProductSheetOpen(false)}
        title="Add from your products"
        description="Pick a saved product to add it as a line item."
      >
        <div className="space-y-1">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              No saved products yet. Type the name and rate directly instead —
              product management arrives in a later milestone.
            </p>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  addLine({
                    productId: product.id,
                    name: product.name,
                    description: product.description,
                    rate: product.rate,
                    unit: product.unit,
                    taxType: product.taxRate
                      ? "percentage"
                      : "none",
                    taxRate: product.taxRate ?? 0,
                  });
                  setProductSheetOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {product.name}
                  </span>
                  <span className="block truncate text-xs text-stone-500">
                    {product.unit || "unit"} ·{" "}
                    {formatMoney(product.rate, currency)}
                    {product.taxRate ? ` · ${product.taxRate}%` : ""}
                  </span>
                </span>
                <Plus
                  className="h-4 w-4 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
              </button>
            ))
          )}
        </div>
      </Sheet>
    </Card>
  );
}

interface ItemCardProps {
  line: BuilderLine;
  symbol: string;
  currency: CurrencyCode;
  showRemove: boolean;
  onUpdate: (patch: Partial<BuilderLine>) => void;
  onRemove: () => void;
}

function ItemCard({
  line,
  symbol,
  currency,
  showRemove,
  onUpdate,
  onRemove,
}: ItemCardProps) {
  const calc = calcLine({
    quantity: line.quantity,
    rate: line.rate,
    discount: line.discount,
    taxType: line.taxType,
    taxRate: line.taxRate,
  });

  return (
    <div className="rounded-xl border border-stone-200 p-3.5 dark:border-stone-700">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Label htmlFor={`item-name-${line.id}`} className="sr-only">
            Item name
          </Label>
          <Input
            id={`item-name-${line.id}`}
            placeholder="Describe the item or service"
            value={line.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        {showRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor={`qty-${line.id}`}>Qty</Label>
          <Input
            id={`qty-${line.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={line.quantity || ""}
            onChange={(e) =>
              onUpdate({ quantity: parseFloatOrZero(e.target.value, 1) })
            }
          />
        </div>
        <div>
          <Label htmlFor={`unit-${line.id}`}>Unit</Label>
          <Input
            id={`unit-${line.id}`}
            placeholder="hour"
            value={line.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`rate-${line.id}`}>Rate</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-400">
              {symbol}
            </span>
            <Input
              id={`rate-${line.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              className="pl-8"
              value={line.rate || ""}
              onChange={(e) =>
                onUpdate({ rate: parseFloatOrZero(e.target.value) })
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`discount-${line.id}`}>Discount %</Label>
          <Input
            id={`discount-${line.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="any"
            placeholder="0"
            value={line.discount || ""}
            onChange={(e) =>
              onUpdate({ discount: parseFloatOrZero(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="w-36">
          <Label htmlFor={`tax-${line.id}`}>Tax</Label>
          <Select
            id={`tax-${line.id}`}
            value={line.taxType}
            onChange={(e) => {
              const taxType = e.target.value;
              onUpdate({
                taxType: isTaxType(taxType) ? taxType : "none",
                taxRate: taxType === "none" ? 0 : line.taxRate,
              });
            }}
          >
            {TAX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        {line.taxType !== "none" && (
          <div className="w-28">
            <Label htmlFor={`tax-rate-${line.id}`}>Rate %</Label>
            <Input
              id={`tax-rate-${line.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={line.taxRate || ""}
              onChange={(e) =>
                onUpdate({ taxRate: parseFloatOrZero(e.target.value) })
              }
            />
          </div>
        )}
        <div className="ml-auto text-right">
          <p className="text-xs text-stone-400">Line total</p>
          <p className="font-display text-base font-bold tracking-tight text-stone-950 dark:text-white">
            {formatMoney(calc.lineTotal, currency)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor={`comments-${line.id}`}>
          Comments / included with this item{" "}
          <span className="font-normal text-stone-400">(optional)</span>
        </Label>
        <Textarea
          id={`comments-${line.id}`}
          rows={2}
          placeholder="e.g. Includes setup, 2 revisions and a domain."
          value={line.comments ?? ""}
          onChange={(e) => onUpdate({ comments: e.target.value })}
        />
      </div>
    </div>
  );
}

function parseFloatOrZero(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}