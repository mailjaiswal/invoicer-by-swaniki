"use client";

import { useState } from "react";
import { Download, Upload, AlertTriangle, FlaskConical, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { db, now, saveSettings } from "@/lib/db/database";
import { useToast } from "@/lib/providers";
import { calcInvoiceTotals, taxBreakupFromTotals } from "@/lib/calculations";
import { uid } from "@/lib/utils";
import type {
  Business,
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  TaxType,
} from "@/lib/types";

const APP_VERSION = "0.1.0";

export function DataSection() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [demoloading, setDemoloading] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  async function exportBackup() {
    setExporting(true);
    try {
      const dump = await db.transaction("r", db.tables, async () => {
        const result: Record<string, unknown> = {};
        for (const table of db.tables) {
          result[table.name] = await table.toArray();
        }
        return result;
      });

      const payload = {
        app: "invoicer-by-swaniki",
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        data: dump,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `invoicer-backup-${stamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported to your device.", "success");
    } catch {
      showToast("Couldn't export the backup. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function loadDemoData() {
    setDemoloading(true);
    try {
      await db.business.put({
        id: "default",
        name: "Swaniki Demo Studio",
        email: "hello@swaniki.example",
        phone: "+91 90000 00000",
        website: "swaniki.example",
        address: "Bengaluru, Karnataka",
        gstin: "29ABCDE1234F1Z5",
        upiId: "demo@swaniki",
        createdAt: now(),
        updatedAt: now(),
      } as Business);
      await seedDemoData();
      showToast("Demo data loaded: customers, products and invoices.", "success");
    } catch {
      showToast("Couldn't load demo data.", "error");
    } finally {
      setDemoloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>
            Your data lives only on this device. Take a copy with you anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={exportBackup} disabled={exporting} className="flex-1">
              <Download className="h-4 w-4" aria-hidden="true" />
              {exporting ? "Exporting…" : "Export Backup"}
            </Button>
            <Button variant="secondary" disabled className="flex-1">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import Backup
            </Button>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Import and restore are coming in a later milestone.
          </p>
        </CardContent>
      </Card>

      {isDev && (
        <Card>
          <CardHeader>
            <CardTitle>Developer tools</CardTitle>
            <CardDescription>
              Visible in development builds only — never in production. Replaces
              customers, products, invoices and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadDemoData} disabled={demoloading}>
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              {demoloading ? "Loading…" : "Load demo data"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200 dark:border-red-900/60">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">
            Dangerous zone
          </CardTitle>
          <CardDescription>
            Clearing all data deletes every invoice, customer and setting on
            this device. Use with care.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Clear All Data
          </Button>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            Available in a later milestone, with strong confirmation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Demo seed                                                           */
/* ------------------------------------------------------------------ */

async function seedDemoData(): Promise<void> {
  await Promise.all([
    db.customers.clear(),
    db.products.clear(),
    db.invoices.clear(),
    db.payments.clear(),
  ]);

  const customers: Customer[] = [
    {
      id: uid("cus"),
      name: "Aarav Kapoor",
      email: "aarav@example.in",
      phone: "+91 98100 12345",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("cus"),
      name: "Bharat Web Studio",
      company: "Bharat Web Studio",
      email: "studio@bharatweb.example",
      phone: "+91 98200 23456",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("cus"),
      name: "Cascade Coffee Co.",
      company: "Cascade Coffee Co.",
      email: "accounts@cascadecoffee.example",
      address: "Pune, Maharashtra",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("cus"),
      name: "Drishti Desai",
      email: "drishti@example.in",
      phone: "+91 98800 34567",
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  await db.customers.bulkPut(customers);

  const products: Product[] = [
    {
      id: uid("prd"),
      name: "Website design",
      description: "Design and build a marketing website",
      rate: 48000,
      unit: "project",
      taxRate: 18,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("prd"),
      name: "Monthly maintenance",
      description: "Ongoing care for your website",
      rate: 5000,
      unit: "month",
      taxRate: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("prd"),
      name: "Brand identity",
      description: "Logo, colours and brand guidelines",
      rate: 20000,
      unit: "project",
      taxRate: 18,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("prd"),
      name: "Consulting",
      description: "Advisory time on demand",
      rate: 2000,
      unit: "hour",
      taxRate: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uid("prd"),
      name: "Product photography",
      description: "Studio shoot for your products",
      rate: 8000,
      unit: "shoot",
      taxRate: 18,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  await db.products.bulkPut(products);

  const [aarav, bharat, cascade, drishti] = customers;

  const invoices = [
    demoInvoice({
      number: "INV-0001",
      customer: aarav,
      items: [
        item("Website design", "project", 1, 48000, "gst_cgst_sgst", 18),
        item("Brand identity", "project", 1, 20000, "gst_cgst_sgst", 18),
      ],
      invoiceDate: "2026-07-20",
      dueDate: "2026-08-04",
      createdMs: new Date("2026-07-20T10:00:00").getTime(),
      payment: { status: "paid", amountPaid: 80240, paidAt: new Date("2026-07-25T09:00:00").getTime() },
    }),
    demoInvoice({
      number: "INV-0002",
      customer: bharat,
      items: [item("Monthly maintenance", "month", 1, 5000, "none", 0)],
      invoiceDate: "2026-08-25",
      dueDate: "2026-09-09",
      createdMs: new Date("2026-08-25T11:00:00").getTime(),
    }),
    demoInvoice({
      number: "INV-0003",
      customer: cascade,
      items: [
        item("Consulting", "hour", 4, 2000, "none", 0),
        item("Product photography", "shoot", 1, 8000, "gst_cgst_sgst", 18),
      ],
      invoiceDate: "2026-09-12",
      dueDate: "2026-09-27",
      createdMs: new Date("2026-09-12T10:00:00").getTime(),
    }),
    demoInvoice({
      number: "INV-0004",
      customer: drishti,
      items: [item("Product photography", "shoot", 1, 8000, "gst_cgst_sgst", 18)],
      invoiceDate: "2026-09-02",
      dueDate: "2026-09-17",
      createdMs: new Date("2026-09-02T10:30:00").getTime(),
      payment: { status: "partial", amountPaid: 3000, paidAt: new Date("2026-09-05T09:00:00").getTime() },
    }),
  ];
  await db.invoices.bulkPut(invoices);

  const payments: Payment[] = [];
  for (const invoice of invoices) {
    if (invoice.payment.amountPaid > 0) {
      payments.push({
        id: uid("pay"),
        invoiceId: invoice.id,
        amount: invoice.payment.amountPaid,
        date: new Date(invoice.payment.paidAt!).toISOString().slice(0, 10),
        method: "upi",
        note: "Demo payment",
        createdAt: invoice.payment.paidAt!,
      });
    }
  }
  await db.payments.bulkPut(payments);

  const settings = await db.settings.get("default");
  if (settings) {
    await saveSettings({ nextInvoiceNumber: 5 });
  }
}

function item(
  name: string,
  unit: string,
  quantity: number,
  rate: number,
  taxType: TaxType,
  taxRate: number
): Omit<InvoiceItem, "id" | "lineTotal"> {
  return {
    name,
    description: undefined,
    unit,
    quantity,
    rate,
    discount: 0,
    taxType,
    taxRate,
  };
}

interface DemoPaymentInput {
  status: "unpaid" | "partial" | "paid";
  amountPaid: number;
  paidAt?: number;
}

function demoInvoice({
  number,
  customer,
  items: rawItems,
  invoiceDate,
  dueDate,
  createdMs,
  payment,
}: {
  number: string;
  customer: Customer;
  items: Array<Omit<InvoiceItem, "id" | "lineTotal">>;
  invoiceDate: string;
  dueDate: string;
  createdMs: number;
  payment?: DemoPaymentInput;
}): Invoice {
  const calc = calcInvoiceTotals(rawItems);
  const items: InvoiceItem[] = rawItems.map((entry, index) => ({
    ...entry,
    id: uid("item"),
    lineTotal: calc.lines[index].lineTotal,
  }));
  const total = calc.totals.total;
  const paid = payment?.amountPaid ?? 0;
  const state = payment?.status ?? "unpaid";
  return {
    id: uid("inv"),
    invoiceNumber: number,
    customerId: customer.id,
    customerSnapshot: {
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      gstin: customer.gstin,
    },
    items,
    invoiceDate,
    dueDate,
    subtotal: calc.totals.subtotal,
    discount: calc.totals.discount,
    taxMode: "gst",
    taxBreakup: taxBreakupFromTotals(calc.totals),
    taxableAmount: calc.totals.taxableAmount,
    taxTotal: calc.totals.taxTotal,
    total,
    payment: {
      status: state,
      amountPaid: paid,
      balance: Math.round((total - paid) * 100) / 100,
      method: paid > 0 ? ("upi" as const) : undefined,
      paidAt: payment?.paidAt,
    },
    notes: "Thank you for your business!",
    terms: "Payment is due within 15 days of the invoice date.",
    template: "modern",
    createdAt: createdMs,
    updatedAt: createdMs,
    status: state,
  };
}