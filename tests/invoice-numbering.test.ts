import { describe, expect, it } from "vitest";
import {
  formatInvoiceNumber,
  isValidInvoiceNumberFormat,
  parseInvoiceNumberSeed,
} from "@/lib/invoice-numbering";

describe("formatInvoiceNumber", () => {
  it("formats with zero padding", () => {
    expect(formatInvoiceNumber("INV", 1, 4)).toBe("INV-0001");
    expect(formatInvoiceNumber("INV", 12, 4)).toBe("INV-0012");
    expect(formatInvoiceNumber("SI-2026", 3, 6)).toBe("SI-2026-000003");
  });

  it("applies defaults", () => {
    expect(formatInvoiceNumber("INV", 7)).toBe("INV-0007");
    expect(formatInvoiceNumber(undefined, 7)).toBe("INV-0007");
  });

  it("clamps bad numbers", () => {
    expect(formatInvoiceNumber("INV", 0, 4)).toBe("INV-0001");
    expect(formatInvoiceNumber("INV", -5, 4)).toBe("INV-0001");
    expect(formatInvoiceNumber("INV", 1.9, 4)).toBe("INV-0001");
  });
});

describe("parseInvoiceNumberSeed", () => {
  it("extracts the trailing number", () => {
    expect(parseInvoiceNumberSeed("INV-0012")).toBe(12);
    expect(parseInvoiceNumberSeed("SI-2026-003")).toBe(3);
    expect(parseInvoiceNumberSeed(" A-42 ")).toBe(42);
  });

  it("returns null when there is no number", () => {
    expect(parseInvoiceNumberSeed("INV-ABC")).toBeNull();
    expect(parseInvoiceNumberSeed("")).toBeNull();
  });
});

describe("isValidInvoiceNumberFormat", () => {
  it("accepts common formats", () => {
    expect(isValidInvoiceNumberFormat("INV-2026-0001")).toBe(true);
    expect(isValidInvoiceNumberFormat("a1/b2.c3")).toBe(true);
    expect(isValidInvoiceNumberFormat("  INV-1  ")).toBe(true);
  });

  it("rejects empty and overlong values", () => {
    expect(isValidInvoiceNumberFormat("")).toBe(false);
    expect(isValidInvoiceNumberFormat("   ")).toBe(false);
    expect(isValidInvoiceNumberFormat("x".repeat(30))).toBe(false);
  });
});