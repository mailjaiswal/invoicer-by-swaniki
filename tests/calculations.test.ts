import { describe, expect, it } from "vitest";
import {
  calcInvoiceTotals,
  calcLine,
  round2,
  taxBreakupFromTotals,
  taxLabel,
  type LineFields,
} from "@/lib/calculations";

function line(overrides: Partial<LineFields> = {}): LineFields {
  return {
    quantity: 1,
    rate: 0,
    discount: 0,
    taxType: "none",
    taxRate: 0,
    ...overrides,
  };
}

describe("calcLine", () => {
  it("computes a plain line", () => {
    const result = calcLine(line({ quantity: 2, rate: 100 }));
    expect(result.gross).toBe(200);
    expect(result.discountAmount).toBe(0);
    expect(result.net).toBe(200);
    expect(result.taxAmount).toBe(0);
    expect(result.lineTotal).toBe(200);
  });

  it("applies percent discount before tax", () => {
    const result = calcLine(
      line({ quantity: 2, rate: 100, discount: 10, taxType: "percentage", taxRate: 18 })
    );
    expect(result.gross).toBe(200);
    expect(result.discountAmount).toBe(20);
    expect(result.net).toBe(180);
    expect(result.taxAmount).toBe(round2(180 * 0.18)); // 32.4
    expect(result.lineTotal).toBe(round2(180 * 1.18)); // 212.4
  });

  it("splits CGST and SGST evenly", () => {
    const result = calcLine(line({ rate: 100, taxType: "gst_cgst_sgst", taxRate: 18 }));
    expect(result.cgst).toBe(9);
    expect(result.sgst).toBe(9);
    expect(result.taxAmount).toBe(18);
    expect(result.lineTotal).toBe(118);
  });

  it("computes IGST as a single charge", () => {
    const result = calcLine(line({ rate: 100, taxType: "gst_igst", taxRate: 18 }));
    expect(result.igst).toBe(18);
    expect(result.lineTotal).toBe(118);
  });

  it("rounds 0.1+0.2 style float drift (7.5% of 199.99)", () => {
    const result = calcLine(line({ rate: 199.99, taxType: "percentage", taxRate: 7.5 }));
    expect(result.taxAmount).toBe(15); // 14.99925 -> 15
    expect(result.lineTotal).toBe(214.99);
  });

  it("rounds discount to cents", () => {
    const result = calcLine(line({ quantity: 3, rate: 99.99, discount: 10 }));
    expect(result.discountAmount).toBe(30); // 29.997 -> 30
    expect(result.lineTotal).toBe(269.97);
  });

  it("guards against NaN inputs", () => {
    const result = calcLine(line({ quantity: NaN, rate: NaN }));
    expect(result.lineTotal).toBe(0);
  });
});

describe("calcInvoiceTotals", () => {
  it("aggregates multiple lines", () => {
    const calc = calcInvoiceTotals([
      line({ quantity: 1, rate: 100, taxType: "gst_cgst_sgst", taxRate: 18 }),
      line({ quantity: 2, rate: 50, discount: 10 }),
    ]);
    expect(calc.totals.subtotal).toBe(200);
    expect(calc.totals.discount).toBe(10);
    expect(calc.totals.taxableAmount).toBe(190);
    expect(calc.totals.taxTotal).toBe(18);
    expect(calc.totals.total).toBe(208);
    expect(calc.lines).toHaveLength(2);
  });

  it("aggregates mixed tax components", () => {
    const calc = calcInvoiceTotals([
      line({ rate: 100, taxType: "gst_cgst_sgst", taxRate: 18 }),
      line({ rate: 100, taxType: "gst_igst", taxRate: 18 }),
      line({ rate: 100, taxType: "percentage", taxRate: 18 }),
    ]);
    expect(calc.totals.breakup).toEqual({ cgst: 9, sgst: 9, igst: 18, other: 18 });
    expect(calc.totals.taxTotal).toBe(54);
    expect(calc.totals.total).toBe(354);
  });

  it("returns zero totals for empty input", () => {
    const calc = calcInvoiceTotals([]);
    expect(calc.totals.total).toBe(0);
    expect(calc.lines).toEqual([]);
  });
});

describe("tax helpers", () => {
  it("collapses totals into a persisted TaxBreakup", () => {
    const calc = calcInvoiceTotals([
      line({ rate: 100, taxType: "gst_cgst_sgst", taxRate: 18 }),
      line({ rate: 50, taxType: "percentage", taxRate: 5 }),
    ]);
    const breakup = taxBreakupFromTotals(calc.totals);
    expect(breakup.type).toBe("gst_cgst_sgst");
    expect(breakup.cgst).toBe(9);
    expect(breakup.amount).toBe(round2(50 * 0.05)); // 2.5
  });

  it("labels tax lines", () => {
    expect(taxLabel("none", 18)).toBe("—");
    expect(taxLabel("percentage", 18)).toBe("18%");
    expect(taxLabel("gst_cgst_sgst", 18)).toBe("CGST 9% + SGST 9%");
    expect(taxLabel("gst_igst", 18)).toBe("IGST 18%");
  });
});

describe("round2", () => {
  it("rounds half up", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1)).toBe(1);
    expect(round2(0.004)).toBe(0);
    expect(round2(NaN)).toBe(0);
    expect(round2(Infinity)).toBe(0);
  });
});