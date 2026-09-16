import { describe, expect, it } from "vitest";
import {
  buildInvoiceMessage,
  buildReminderMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
} from "@/lib/share";
import type { MessageContext } from "@/lib/share";

const ctx: MessageContext = {
  customerName: "Raj Sharma",
  invoiceNumber: "INV-0025",
  amount: "₹59,000",
  dueDate: "30 Sep",
  businessName: "Acme",
};

const ctxNoDueDate: MessageContext = {
  ...ctx,
  dueDate: undefined,
};

describe("buildInvoiceMessage", () => {
  it("professional style includes customer name, invoice and amount", () => {
    const msg = buildInvoiceMessage("professional", ctx);
    expect(msg).toContain("Raj");
    expect(msg).toContain("INV-0025");
    expect(msg).toContain("₹59,000");
    expect(msg).toContain("30 Sep");
    expect(msg).toContain("Acme");
  });

  it("short style is concise", () => {
    const msg = buildInvoiceMessage("short", ctx);
    expect(msg).toContain("INV-0025");
    expect(msg).toContain("₹59,000");
    expect(msg.length).toBeLessThan(120);
  });

  it("omits due date text when not set", () => {
    const msg = buildInvoiceMessage("professional", ctxNoDueDate);
    expect(msg).not.toContain("due by");
  });
});

describe("buildReminderMessage", () => {
  it("gentle reminder includes outstanding amount and customer first name", () => {
    const msg = buildReminderMessage("gentle_reminder", ctx);
    expect(msg).toContain("Hi Raj");
    expect(msg).toContain("₹59,000");
    expect(msg).toContain("30 Sep");
    expect(msg).toContain("Acme");
  });

  it("final reminder sounds stronger", () => {
    const msg = buildReminderMessage("final_reminder", ctx);
    expect(msg.toLowerCase()).toContain("final reminder");
  });

  it("short reminder is brief", () => {
    const msg = buildReminderMessage("short", ctx);
    expect(msg).toContain("INV-0025");
    expect(msg.length).toBeLessThan(140);
  });
});

describe("normalizeWhatsAppPhone", () => {
  it("keeps a reasonable phone", () => {
    expect(normalizeWhatsAppPhone("+91 98765 43210")).toBe("919876543210");
  });

  it("strips formatting characters", () => {
    expect(normalizeWhatsAppPhone("(011) 1234-5678")).toBe("01112345678");
  });

  it("returns empty for too-short or non-numeric", () => {
    expect(normalizeWhatsAppPhone("123")).toBe("");
    expect(normalizeWhatsAppPhone("abcdef")).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("includes the phone and encoded text", () => {
    const url = buildWhatsAppUrl("Hello Raj!", "919876543210");
    expect(url).toContain("wa.me/919876543210");
    expect(url).toContain("text=Hello");
    expect(url).toContain("Raj");
  });

  it("works without a phone number", () => {
    const url = buildWhatsAppUrl("Hi there");
    expect(url).toContain("wa.me/?text=");
  });

  it("properly encodes special characters", () => {
    const url = buildWhatsAppUrl("Amount: ₹59,000 (due 30 Sep)");
    expect(url).toContain("text=Amount");
  });
});