import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/formatting";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";

const ZERO_DECIMAL = ["JPY", "KRW", "IDR", "VND", "HUF"];

describe("formatMoney", () => {
  it("formats INR with decimal amounts", () => {
    expect(formatMoney(26260.5, "INR")).toBe("₹26,260.5");
    expect(formatMoney(26260, "INR")).toBe("₹26,260");
    expect(formatMoney(0, "INR")).toBe("₹0");
  });

  it("shows no fractions for zero-decimal currencies", () => {
    for (const code of ZERO_DECIMAL) {
      expect(formatMoney(1500.99, code as CurrencyCode)).toBe(
        formatMoney(Math.round(1500.99), code as CurrencyCode)
      );
    }
  });

  it("mirrors the native locale output for every currency", () => {
    for (const [code, config] of Object.entries(CURRENCIES)) {
      const reference = new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        maximumFractionDigits: config.digits,
        minimumFractionDigits: 0,
      }).format(1234.567);
      expect(formatMoney(1234.567, code as CurrencyCode)).toBe(reference);
    }
  });
});