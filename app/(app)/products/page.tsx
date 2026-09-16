"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Button } from "@/components/common/button";
import { Sheet } from "@/components/common/sheet";
import { Card, CardContent } from "@/components/common/card";
import { EmptyState } from "@/components/common/empty-state";
import { useAppCurrency, useToast } from "@/lib/providers";
import { db } from "@/lib/db/database";
import { deleteProduct, listProducts, upsertProduct } from "@/lib/db/records";
import { formatMoney } from "@/lib/formatting";
import type { Product, ProductDraft } from "@/lib/types";

interface ProductForm {
  name: string;
  description: string;
  rate: string;
  unit: string;
  taxRate: string;
}

function blankForm(): ProductForm {
  return { name: "", description: "", rate: "", unit: "", taxRate: "" };
}

function formFromProduct(product: Product): ProductForm {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    rate: String(product.rate || ""),
    unit: product.unit ?? "",
    taxRate: String(product.taxRate || ""),
  };
}

function parseNumber(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ProductsPage() {
  const products = useLiveQuery(() => listProducts(), []);
  const currency = useAppCurrency();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(blankForm());
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const invoiceCountsByProduct = useLiveQuery(async () => {
    const counts = new Map<string, number>();
    const all = await db.invoices.toArray();
    for (const invoice of all) {
      const seen = new Set<string>();
      for (const item of invoice.items) {
        if (!item.productId || seen.has(item.productId)) continue;
        seen.add(item.productId);
        counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
      }
    }
    return counts;
  }, []);
  const referencedCount = deleting
    ? invoiceCountsByProduct?.get(deleting.id) ?? 0
    : 0;

  const filtered = useMemo(() => {
    if (!products) return products;
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      [product.name, product.description ?? "", product.unit ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [products, query]);

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(formFromProduct(product));
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      showToast("Product name is required.", "error");
      return;
    }
    const rate = parseNumber(form.rate);
    const taxRate = parseNumber(form.taxRate);
    if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
      showToast("Tax rate must be between 0 and 100.", "error");
      return;
    }
    setBusy("save");
    try {
      const draft: ProductDraft = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        rate: rate ?? 0,
        unit: form.unit.trim(),
        taxRate: taxRate ?? null,
      };
      await upsertProduct(draft);
      setFormOpen(false);
      showToast(editing ? "Product updated." : "Product added.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't save the product.", "error");
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy("delete");
    try {
      await deleteProduct(deleting.id);
      showToast(`${deleting.name} removed.`);
      setDeleting(null);
    } catch {
      showToast("Couldn't remove the product.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Products &amp; Services
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Save frequently used services so invoicing takes seconds.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add product
        </Button>
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

      {!products ? (
        <p className="py-8 text-center text-sm text-stone-500">
          Loading products…
        </p>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onEdit={() => openEdit(product)}
              onDelete={() => setDeleting(product)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-7 w-7" aria-hidden="true" />}
          title={
            query.trim()
              ? "No products match your search."
              : "No products or services yet."
          }
          description={
            query.trim()
              ? "Try a different search."
              : "Save frequently used services to create invoices faster. Defaults fill in automatically and stay editable."
          }
          action={
            query.trim() ? undefined : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add product
              </Button>
            )
          }
        />
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit product" : "Add product"}
        description={editing ? `Update details for ${editing.name}.` : "Save a service or product to reuse it in invoices."}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              autoFocus
              placeholder="e.g. Website maintenance"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="product-desc">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="product-desc"
              placeholder="Monthly care and updates"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-rate">Rate</Label>
              <Input
                id="product-rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="product-unit">Unit</Label>
              <Input
                id="product-unit"
                placeholder="hour"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-tax">
              Tax rate % <span className="font-normal text-stone-400">(optional)</span>
            </Label>
            <Input
              id="product-tax"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="any"
              placeholder="18"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={submitForm} disabled={busy === "save"}>
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editing ? "Save changes" : "Add product"}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove this product?"
        description="This just removes it from your saved list. Past invoices are unaffected."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">{deleting?.name}</p>
            {deleting?.description && (
              <p className="mt-0.5 text-xs opacity-80">{deleting.description}</p>
            )}
          </div>
          {referencedCount > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Used on {referencedCount}{" "}
              {referencedCount === 1 ? "invoice" : "invoices"} on this device.
              Those line items keep their own name, rate and tax as a snapshot,
              so history stays accurate.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDelete}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Remove
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function ProductCard({
  product,
  currency,
  onEdit,
  onDelete,
}: {
  product: Product;
  currency: ReturnType<typeof useAppCurrency>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="transition-colors hover:border-stone-300 dark:hover:border-stone-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-950 dark:text-white">
              {product.name}
            </p>
            {product.description && (
              <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${product.name}`} onClick={onEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${product.name}`} onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="font-display text-xl font-bold tracking-tight text-stone-950 dark:text-white">
            {formatMoney(product.rate, currency)}
            {product.unit && (
              <span className="ml-1 text-xs font-medium text-stone-400">/ {product.unit}</span>
            )}
          </p>
          {product.taxRate ? (
            <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {product.taxRate}% tax
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}