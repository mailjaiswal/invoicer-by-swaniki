import { describe, expect, it } from "vitest";
import {
  blankLine,
  lineFromProduct,
  syncLineFromProduct,
} from "@/components/invoice/builder-utils";
import {
  buildInvoiceDocDef,
  buildReceiptDocDef,
} from "@/lib/pdf";
import type { AppSettings, Invoice, Product } from "@/lib/types";

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Branded T-shirt",
    description: "Premium 100% cotton",
    unit: "piece",
    rate: 699,
    taxRate: 18,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function sampleInvoice(): Invoice {
  return {
    id: "inv-1",
    invoiceNumber: "INV-0001",
    customerSnapshot: { name: "Acme Corp" },
    items: [
      {
        id: "item-1",
        name: "Branded T-shirt",
        description: "Premium 100% cotton",
        quantity: 2,
        unit: "piece",
        rate: 699,
        taxType: "gst_cgst_sgst",
        taxRate: 18,
        discount: 0,
        lineTotal: 1649.64,
      },
    ],
    invoiceDate: "2026-05-17",
    dueDate: "2026-06-16",
    subtotal: 1398,
    discount: 0,
    taxMode: "gst",
    taxBreakup: { type: "gst_cgst_sgst", rate: 18, cgst: 125.82, sgst: 125.82 },
    taxableAmount: 1398,
    taxTotal: 251.64,
    total: 1649.64,
    payment: { status: "unpaid", amountPaid: 0, balance: 1649.64 },
    notes: "Thanks for your business!",
    terms: "Payment due within 15 days.",
    template: "modern",
    createdAt: 0,
    updatedAt: 0,
    status: "unpaid",
  };
}

describe("lineFromProduct", () => {
  it("builds a linked line from a product", () => {
    const line = lineFromProduct(sampleProduct());
    expect(line.productId).toBe("prod-1");
    expect(line.linked).toBe(true);
    expect(line.name).toBe("Branded T-shirt");
    expect(line.rate).toBe(699);
    expect(line.taxType).toBe("percentage");
    expect(line.taxRate).toBe(18);
    expect(line.quantity).toBe(1);
  });
});

describe("syncLineFromProduct", () => {
  it("re-applies product fields onto a linked line", () => {
    const line = lineFromProduct(sampleProduct({ rate: 499 }));
    const synced = syncLineFromProduct(
      line,
      sampleProduct({ name: "Branded Tee", rate: 799 })
    );
    expect(synced.name).toBe("Branded Tee");
    expect(synced.rate).toBe(799);
    expect(synced.linked).toBe(true);
    expect(synced.quantity).toBe(1);
  });

  it("preserves user-owned fields (quantity, discount, comments)", () => {
    const line = {
      ...lineFromProduct(sampleProduct()),
      quantity: 3,
      discount: 10,
      comments: "rush order",
    };
    const synced = syncLineFromProduct(line, sampleProduct({ rate: 999 }));
    expect(synced.quantity).toBe(3);
    expect(synced.discount).toBe(10);
    expect(synced.comments).toBe("rush order");
    expect(synced.rate).toBe(999);
  });

  it("returns the line unchanged when it is not linked", () => {
    const line = blankLine();
    const synced = syncLineFromProduct(line, sampleProduct());
    expect(synced).toBe(line);
  });

  it("returns the line unchanged when the product was removed", () => {
    const line = lineFromProduct(sampleProduct());
    const synced = syncLineFromProduct(line, undefined);
    expect(synced).toBe(line);
  });

  it("clears rate tax when the product has none", () => {
    const line = lineFromProduct(sampleProduct({ taxRate: 18 }));
    const synced = syncLineFromProduct(line, sampleProduct({ taxRate: 0 }));
    expect(synced.taxType).toBe("none");
    expect(synced.taxRate).toBe(0);
  });
});

describe("page orientation", () => {
  it("defaults the invoice to portrait", () => {
    const doc = buildInvoiceDocDef(sampleInvoice());
    expect(doc.pageOrientation).toBe("portrait");
  });

  it("renders landscape when configured", () => {
    const doc = buildInvoiceDocDef(
      sampleInvoice(),
      undefined,
      { id: "s", pageOrientation: "landscape", createdAt: 0, updatedAt: 0 } as AppSettings
    );
    expect(doc.pageOrientation).toBe("landscape");
  });
});

describe("custom Notes/Terms labels", () => {
  it("uses custom notes and terms labels on the invoice", () => {
    const doc = buildInvoiceDocDef(
      sampleInvoice(),
      undefined,
      {
        id: "s",
        notesLabel: "Message",
        termsLabel: "Deadline",
        createdAt: 0,
        updatedAt: 0,
      } as AppSettings
    );
    const json = JSON.stringify(doc);
    expect(json).toContain("MESSAGE");
    expect(json).toContain("DEADLINE");
    expect(json).not.toContain(`"TERMS"`);
  });

  it("uses the custom notes label on the receipt", () => {
    const doc = buildReceiptDocDef(
      sampleInvoice(),
      undefined,
      { id: "s", notesLabel: "Message", createdAt: 0, updatedAt: 0 } as AppSettings
    );
    const json = JSON.stringify(doc);
    expect(json).toContain("MESSAGE");
  });
});