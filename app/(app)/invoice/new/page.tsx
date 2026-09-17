"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoice/invoice-builder";

export default function NewInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden="true">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        </div>
      }
    >
      <BuilderRoute />
    </Suspense>
  );
}

function BuilderRoute() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "quick" ? "quick" : "standard";
  const docType =
    searchParams.get("type") === "quotation" ? "quotation" : "invoice";
  const duplicateId = searchParams.get("duplicate");
  const editId = searchParams.get("edit");

  return (
    <InvoiceBuilder
      mode={mode}
      docType={docType}
      duplicateId={duplicateId}
      editId={editId}
    />
  );
}