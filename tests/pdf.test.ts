import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import type { AppSettings, Invoice } from "@/lib/types";
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
  Poppins: {
    normal: "public/fonts/Poppins-Regular.ttf",
    bold: "public/fonts/Poppins-Bold.ttf",
    italics: "public/fonts/Poppins-Regular.ttf",
    bolditalics: "public/fonts/Poppins-Bold.ttf",
  },
  Tinos: {
    normal: "public/fonts/Tinos-Regular.ttf",
    bold: "public/fonts/Tinos-Bold.ttf",
    italics: "public/fonts/Tinos-Regular.ttf",
    bolditalics: "public/fonts/Tinos-Bold.ttf",
  },
};

function sampleInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    docType: "invoice",
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

function sampleSettings(
  overrides: Partial<AppSettings> = {}
): AppSettings {
  return {
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
    ...overrides,
  };
}

function renderPdf(docDef: unknown): Promise<number> {
  return pdfMakeNode
    .createPdf(docDef)
    .getBuffer()
    .then((buffer: { length: number }) => buffer.length);
}

/** Flatten every text string in a pdfmake definition tree. */
function collectText(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectText(item, out);
    return out;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string") out.push(obj.text);
    for (const key of Object.keys(obj)) {
      if (key === "text") continue;
      collectText(obj[key], out);
    }
  }
  return out;
}

/** The default font family set on a doc definition, or null. */
function defaultFont(docDef: unknown): string | null {
  if (docDef && typeof docDef === "object") {
    const { defaultStyle } = docDef as Record<string, unknown>;
    if (defaultStyle && typeof defaultStyle === "object") {
      return (defaultStyle as Record<string, unknown>).font as string | null;
    }
  }
  return null;
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

  it("renders the Classic template with accent color", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(
      buildInvoiceDocDef(
        invoice,
        {
          id: "biz",
          name: "Swaniki Studio",
          email: "hi@swaniki.example",
          phone: "+91 90000 00000",
          address: "14th Cross, Indiranagar, Bengaluru",
          gstin: "29ABCDE1234F1Z5",
          upiId: "swaniki@oksbi",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "settings",
          invoicePrefix: "INV",
          nextInvoiceNumber: 2,
          invoiceNumberPadding: 4,
          currency: "INR",
          taxMode: "gst",
          defaultTax: null,
          defaultTerms: "",
          defaultTemplate: "classic",
          defaultPaymentTermsDays: 15,
          theme: "light",
          accentColor: "#2563eb",
          personality: "professional",
          createdAt: 0,
          updatedAt: 0,
        },
        { upiQrDataUrl: PNG_1PX }
      )
    );
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);

  it("renders the Compact template with a logo and friendly personality", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(
      buildInvoiceDocDef(
        invoice,
        {
          id: "biz",
          name: "Swaniki Studio",
          email: "hi@swaniki.example",
          phone: "+91 90000 00000",
          address: "14th Cross, Indiranagar, Bengaluru",
          gstin: "29ABCDE1234F1Z5",
          upiId: "swaniki@oksbi",
          logo: PNG_1PX,
          logoPosition: "left",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "settings",
          invoicePrefix: "INV",
          nextInvoiceNumber: 2,
          invoiceNumberPadding: 4,
          currency: "INR",
          taxMode: "gst",
          defaultTax: null,
          defaultTerms: "",
          defaultTemplate: "compact",
          defaultPaymentTermsDays: 15,
          theme: "light",
          accentColor: "#b45309",
          personality: "friendly",
          createdAt: 0,
          updatedAt: 0,
        }
      )
    );
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);

  it("renders the Classic template with a centred logo and accent", async () => {
    const invoice = sampleInvoice();
    const bytes = await renderPdf(
      buildInvoiceDocDef(
        invoice,
        {
          id: "biz",
          name: "Swaniki Studio",
          email: "hi@swaniki.example",
          phone: "+91 90000 00000",
          address: "14th Cross, Indiranagar, Bengaluru",
          gstin: "29ABCDE1234F1Z5",
          upiId: "swaniki@oksbi",
          logo: PNG_1PX,
          logoPosition: "center",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: "settings",
          invoicePrefix: "INV",
          nextInvoiceNumber: 2,
          invoiceNumberPadding: 4,
          currency: "INR",
          taxMode: "gst",
          defaultTax: null,
          defaultTerms: "",
          defaultTemplate: "classic",
          defaultPaymentTermsDays: 15,
          theme: "light",
          accentColor: "#dc2626",
          personality: "minimal",
          createdAt: 0,
          updatedAt: 0,
        }
      )
    );
    expect(bytes).toBeGreaterThan(1000);
  }, 15000);

  const TEMPLATES: AppSettings["defaultTemplate"][] = [
    "minimal",
    "bold",
    "elegant",
  ];

  for (const template of TEMPLATES) {
    it(`renders the ${template} template`, async () => {
      const bytes = await renderPdf(
        buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings({ defaultTemplate: template }))
      );
      expect(bytes).toBeGreaterThan(1000);
    }, 15000);
  }

  it("selects the configured font family on the invoice", () => {
    const doc = buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings({ docFont: "poppins" }));
    expect(defaultFont(doc)).toBe("Poppins");
    const tinos = buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings({ docFont: "tinos" }));
    expect(defaultFont(tinos)).toBe("Tinos");
    const roboto = buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings());
    expect(defaultFont(roboto)).toBe("Roboto");
  });

  it("selects the configured font family on the receipt", () => {
    const doc = buildReceiptDocDef(sampleInvoice(), undefined, sampleSettings({ docFont: "poppins" }));
    expect(defaultFont(doc)).toBe("Poppins");
    const roboto = buildReceiptDocDef(sampleInvoice(), undefined, sampleSettings());
    expect(defaultFont(roboto)).toBe("Roboto");
  });

  it("renders each doc font family to a buffer", async () => {
    for (const font of ["poppins", "tinos"] as const) {
      const invoice = sampleInvoice();
      await expect(
        renderPdf(buildInvoiceDocDef(invoice, undefined, sampleSettings({ docFont: font })))
      ).resolves.toBeGreaterThan(1000);
    }
  }, 20000);

  it("includes the legal disclaimer on the invoice", () => {
    const doc = buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings());
    const text = collectText(doc);
    expect(text.some((t) => t.includes("Not tax or legal advice"))).toBe(true);
  });

  it("renders the item name boldly with description and comments as smaller sub-text", () => {
    const doc = buildInvoiceDocDef(
      sampleInvoice({
        items: [
          {
            id: "item-1",
            name: "Website design",
            description: "Homepage + 4 inner pages",
            comments: "Includes setup, 2 revisions and a domain.",
            quantity: 2,
            unit: "pages",
            rate: 12000,
            taxType: "gst_cgst_sgst",
            taxRate: 18,
            discount: 5,
            lineTotal: 25080,
          },
        ],
      }),
      undefined,
      sampleSettings()
    );
    const text = collectText(doc);
    const name = text.find((t) => t === "Website design");
    expect(name).toBeDefined();
    expect(text.some((t) => t === "Homepage + 4 inner pages")).toBe(true);
    expect(text.some((t) => t === "Includes setup, 2 revisions and a domain.")).toBe(true);
  });

  it("uses Particulars as the item column header", () => {
    const doc = buildInvoiceDocDef(sampleInvoice(), undefined, sampleSettings());
    const text = collectText(doc);
    expect(text.some((t) => t === "Particulars")).toBe(true);
    expect(text.some((t) => t === "Description")).toBe(false);
  });

  it("renders a quotation title, valid-until date and no status", () => {
    const doc = buildInvoiceDocDef(
      sampleInvoice({
        docType: "quotation",
        invoiceNumber: "QOT-0001",
        dueDate: null,
        validityDate: "2026-06-16",
        status: "unpaid",
        payment: { status: "unpaid", amountPaid: 0, balance: 26260 },
      }),
      undefined,
      sampleSettings()
    );
    const text = collectText(doc);
    expect(text.some((t) => t === "QUOTATION")).toBe(true);
    expect(text.some((t) => t.startsWith("Valid until"))).toBe(true);
    expect(text.some((t) => t === "UNPAID")).toBe(false);
    expect(text.some((t) => t === "PAID")).toBe(false);
  });

  it("skips the UPI QR block for quotations", () => {
    const invoice = sampleInvoice({
      docType: "quotation",
      invoiceNumber: "QOT-0001",
      dueDate: null,
      validityDate: "2026-06-16",
      status: "unpaid",
      payment: { status: "unpaid", amountPaid: 0, balance: 26260 },
    });
    const doc = buildInvoiceDocDef(
      invoice,
      {
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
    );
    const text = collectText(doc);
    expect(text.some((t) => t.includes("Pay via UPI"))).toBe(false);
  });

  it("includes the legal disclaimer on the receipt", () => {
    const doc = buildReceiptDocDef(sampleInvoice(), undefined, sampleSettings());
    const text = collectText(doc);
    expect(text.some((t) => t.includes("Not tax or legal advice"))).toBe(true);
  });
});

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";