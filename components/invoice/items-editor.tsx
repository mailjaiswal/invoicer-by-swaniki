"use client";

import { useMemo, useState } from "react";
import { Check, Package, Plus, Trash2 } from "lucide-react";
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
import { uid, cn } from "@/lib/utils";
import type { Product, TaxType } from "@/lib/types";
import { isTaxType, lineFromProduct, FREQUENCY_OPTIONS, type BuilderLine } from "./builder-utils";

const TAX_OPTIONS: Array<{ value: TaxType; label: string }> = [
  { value: "none", label: "No tax" },
  { value: "percentage", label: "Percentage" },
  { value: "gst_igst", label: "IGST" },
  { value: "gst_cgst_sgst", label: "CGST + SGST" },
];

/** Fields that belong to the source product — editing these breaks the link. */
const PRODUCT_SHARED_KEYS = [
  "name",
  "description",
  "rate",
  "taxType",
  "taxRate",
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
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const symbol = CURRENCIES[currency]?.symbol ?? CURRENCIES.INR.symbol;

  const pendingProducts = useMemo(
    () =>
      pendingIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p),
    [pendingIds, products]
  );

  const togglePending = (id: string) => {
    setPendingIds((current) =>
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id]
    );
  };

  const addSelectedProducts = () => {
    if (pendingProducts.length === 0) return;
    onChange([
      ...items,
      ...pendingProducts.map((product) => lineFromProduct(product)),
    ]);
    setPendingIds([]);
    setProductSheetOpen(false);
  };

  const updateLine = (id: string, patch: Partial<BuilderLine>) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        if (patch.productId || "linked" in patch) {
          return { ...item, ...patch };
        }
        const editsShared = Object.keys(patch).some((key) =>
          PRODUCT_SHARED_KEYS.includes(key)
        );
        return {
          ...item,
          ...patch,
          linked: editsShared ? false : item.linked,
        };
      })
    );
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
            products={products}
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
        onClose={() => {
          setProductSheetOpen(false);
          setPendingIds([]);
        }}
        title="Add from your products"
        description="Select one or more saved products to add them as line items."
      >
        <div className="space-y-1">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              No saved products yet. Add them from the Products page, or type
              the item name and rate directly here.
            </p>
          ) : (
            products.map((product) => {
              const selected = pendingIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePending(product.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/30"
                      : "border-transparent hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      selected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-stone-300 dark:border-stone-600"
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {product.name}
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {formatMoney(product.rate, currency)}
                      {product.taxRate ? ` · ${product.taxRate}%` : ""}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-stone-400">
                    {product.description ? "·" : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>
        {products.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={addSelectedProducts} disabled={pendingIds.length === 0}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add selected{pendingIds.length > 0 ? ` (${pendingIds.length})` : ""}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setPendingIds(
                  pendingIds.length === products.length
                    ? []
                    : products.map((p) => p.id)
                )
              }
            >
              {pendingIds.length === products.length
                ? "Clear selection"
                : "Select all"}
            </Button>
          </div>
        )}
      </Sheet>
    </Card>
  );
}

interface ItemCardProps {
  line: BuilderLine;
  products: Product[];
  symbol: string;
  currency: CurrencyCode;
  showRemove: boolean;
  onUpdate: (patch: Partial<BuilderLine>) => void;
  onRemove: () => void;
}

function ItemCard({
  line,
  products,
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

  const [nameOpen, setNameOpen] = useState(false);

  const productSuggestions = useMemo(() => {
    const needle = line.name.trim().toLowerCase();
    if (!needle) return [];
    return products
      .filter((product) =>
        [product.name, product.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 6);
  }, [products, line.name]);

  const showSuggestions = nameOpen && productSuggestions.length > 0;

  return (
    <div className="rounded-xl border border-stone-200 p-3.5 dark:border-stone-700">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Label htmlFor={`item-name-${line.id}`} className="sr-only">
            Item name
          </Label>
          <Input
            id={`item-name-${line.id}`}
            placeholder="Describe the item or service"
            value={line.name}
            onFocus={() => setNameOpen(true)}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
          {showSuggestions && (
            <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-900">
              {productSuggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onUpdate({
                      productId: product.id,
                      linked: true,
                      name: product.name,
                      description: product.description,
                      rate: product.rate,
                      taxType: product.taxRate ? "percentage" : "none",
                      taxRate: product.taxRate ?? 0,
                    });
                    setNameOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Package
                    className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {product.name}
                    </span>
                    {!!product.description && (
                      <span className="block truncate text-xs text-stone-500">
                        {product.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">
                    {formatMoney(product.rate, currency)}
                  </span>
                </button>
              ))}
            </div>
          )}
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
          <Label htmlFor={`frequency-${line.id}`}>Frequency</Label>
          <Input
            id={`frequency-${line.id}`}
            list={`frequency-options-${line.id}`}
            placeholder="One-time"
            value={line.frequency ?? ""}
            onChange={(e) => onUpdate({ frequency: e.target.value })}
          />
          <datalist id={`frequency-options-${line.id}`}>
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
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

      {line.linked && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
          <Package className="h-3 w-3" aria-hidden="true" />
          Linked to a saved product — name, rate &amp; tax update automatically.
          Edit any of those to take manual control.
        </p>
      )}

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