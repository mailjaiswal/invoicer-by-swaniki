import { describe, expect, it } from "vitest";
import { buildReceiptNumber } from "@/lib/print";

describe("buildReceiptNumber", () => {
  it("prefixes an invoice number with RCPT-", () => {
    expect(buildReceiptNumber("INV-0001")).toBe("RCPT-INV-0001");
  });

  it("preserves custom invoice numbers", () => {
    expect(buildReceiptNumber("JULY/2026/007")).toBe("RCPT-JULY/2026/007");
  });

  it("trims surrounding whitespace", () => {
    expect(buildReceiptNumber("  INV-0042 ")).toBe("RCPT-INV-0042");
  });

  it("falls back to RCPT for an empty number", () => {
    expect(buildReceiptNumber("")).toBe("RCPT");
    expect(buildReceiptNumber("   ")).toBe("RCPT");
  });

  it("coerces non-string input safely", () => {
    expect(buildReceiptNumber(undefined as unknown as string)).toBe("RCPT");
    expect(buildReceiptNumber(null as unknown as string)).toBe("RCPT");
  });
});