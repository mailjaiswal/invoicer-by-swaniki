import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import type { Invoice } from "@/lib/types";
import {
  buildInvoiceDocDef,
  buildPdfFileName,
  buildReceiptDocDef,
} from "@/lib/pdf";

const require = createRequire(import.meta.url);
const pdfMakeNode = require("pdfmake/js/index.js");

pdfMakeNode.fonts = {
  Roboto: {
    normal: "node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf",
    bold: "node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf",
    italics: "node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf",
    bolditalics: "node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf",
  },
};

function sampleInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    invoiceNumber: "INV-0001",
    customerSnapshot: {
      name: "Acme Corp",
      company: "Acme Corporation Pvt Ltd",
      email: "billing@acme.example",
      phone: "+91 98765 43210",
      address: "123 MG Road, Bengaluru",
      gstin: "29ABCDE1234F1Z5",
    },
    items: [
      {
        id: "item-1",
        name: "Website design",
        description: "Homepage + 4 inner pages",
        quantity: 2,
        unit: "pages",
        rate: 12000,
        taxType: "gst_cgst_sgst",
        taxRate: 18,
        discount: 5,
        lineTotal: 25080,
      },
      {
        id: "item-2",
        name: "Domain setup",
        description: "One-time setup",
        quantity: 1,
        unit: "unit",
        rate: 1000,
        taxType: "gst_igst",
        taxRate: 18,
        discount: 0,
        lineTotal: 1180,
      },
    ],
    invoiceDate: "2026-05-17",
    dueDate: "2026-06-16",
    subtotal: 25000,
    discount: 1200,
    taxMode: "gst",
    taxBreakup: { type: "gst_cgst_sgst", rate: 18, cgst: 1192.5, sgst: 1192.5 },
    taxableAmount: 23800,
    taxTotal: 2385,
    total: 26260,
    payment: {
      status: "partial",
      amountPaid: 10000,
      balance: 16260,
      method: "upi",
      paidAt: 1747996800000,
      reference: "UTR123456789",
    },
    notes: "Thanks for your business!",
    terms: "Payment due within 15 days.",
    template: "modern",
    createdAt: 1747996800000,
    updatedAt: 1747996800000,
    status: "partial",
    ...overrides,
  };
}

function renderPdf(docDef: unknown): Promise<number> {
  return pdfMakeNode
    .createPdf(docDef)
    .getBuffer()
    .then((buffer: { length: number }) => buffer.length);
}

describe("buildPdfFileName", () => {
  it("keeps letters, digits and dashes", () => {
    expect(buildPdfFileName("INV-0001")).toBe("INV-0001.pdf");
    expect(buildPdfFileName("RCPT-INV-2026-001")).toBe(
      "RCPT-INV-2026-001.pdf"
    );
  });

  it("falls back for blank input", () => {
    expect(buildPdfFileName("")).toBe("document.pdf");
    expect(buildPdfFileName("   ")).toBe("document.pdf");
  });

  it("sanitizes special characters", () => {
    expect(buildPdfFileName("INV #42/23")).toBe("INV-42-23.pdf");
    expect(buildPdfFileName("INV_001")).toBe("INV-001.pdf");
  });
});

describe("pdfmake document definitions", () => {
  it("renders an invoice PDF to a buffer", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(
      buildInvoiceDocDef(invoice, {
        id: "biz",
        name: "Swaniki Studio",
        email: "hi@swaniki.example",
        phone: "+91 90000 00000",
        address: "14th Cross, Indiranagar, Bengaluru",
        gstin: "29ABCDE1234F1Z5",
        upiId: "swaniki@oksbi",
        createdAt: 0,
        updatedAt: 0,
      }, {
        id: "settings",
        invoicePrefix: "INV",
        nextInvoiceNumber: 2,
        invoiceNumberPadding: 4,
        currency: "INR",
        taxMode: "gst",
        defaultTax: null,
        defaultTerms: "",
        defaultTemplate: "modern",
        defaultPaymentTermsDays: 15,
        theme: "light",
        accentColor: "#1a6553",
        createdAt: 0,
        updatedAt: 0,
      })
    );
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);

  it("renders a receipt PDF to a buffer", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(buildReceiptDocDef(invoice));
    expect(bytes).toBeGreaterThan(800);
  }, 15000);

  it("renders a fully paid invoice with no tax rows", async () => {
    const invoice = sampleInvoice({
      status: "paid",
      taxMode: "none",
      taxBreakup: { type: "none", rate: 0 },
      taxTotal: 0,
      total: 23800,
      payment: {
        status: "paid",
        amountPaid: 23800,
        balance: 0,
        method: "bank_transfer",
        reference: "NEFT123",
      },
    });
    const bytes = await renderPdf(buildInvoiceDocDef(invoice));
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);

  it("renders an invoice with a UPI QR option", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(
      buildInvoiceDocDef(invoice, {
        id: "biz",
        name: "Swaniki Studio",
        email: "hi@swaniki.example",
        phone: "+91 90000 00000",
        address: "14th Cross, Indiranagar, Bengaluru",
        gstin: "29ABCDE1234F1Z5",
        upiId: "swaniki@oksbi",
        showUpiQr: true,
        createdAt: 0,
        updatedAt: 0,
      },
      undefined,
      { upiQrDataUrl: PNG_1PX }
      )
    );
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);
});

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";