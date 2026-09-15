import { describe, expect, it } from "vitest";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import type { Invoice } from "@/lib/types";

function invoice(
  overrides: Partial<Invoice> = {}
): Pick<Invoice, "status" | "dueDate" | "payment"> {
  return {
    status: "unpaid",
    dueDate: null,
    payment: { status: "unpaid", amountPaid: 0, balance: 100 },
    ...overrides,
  };
}

const march19 = new Date("2026-03-19T12:00:00");

describe("deriveInvoiceStatus", () => {
  it("keeps drafts as drafts", () => {
    expect(deriveInvoiceStatus(invoice({ status: "draft" }), march19)).toBe("draft");
  });

  it("stays paid regardless of the due date", () => {
    expect(
      deriveInvoiceStatus(
        invoice({ dueDate: "2026-01-01", payment: { status: "paid", amountPaid: 100, balance: 0 } }),
        march19
      )
    ).toBe("paid");
  });

  it("reports partial for open balances with some payment", () => {
    expect(
      deriveInvoiceStatus(
        invoice({ dueDate: "2026-01-01", payment: { status: "partial", amountPaid: 40, balance: 60 } }),
        march19
      )
    ).toBe("partial");
  });

  it("reports overdue for past-due unpaid invoices", () => {
    expect(
      deriveInvoiceStatus(invoice({ dueDate: "2026-03-10" }), march19)
    ).toBe("overdue");
  });

  it("reports unpaid while the due date is in the future", () => {
    expect(
      deriveInvoiceStatus(invoice({ dueDate: "2026-03-25" }), march19)
    ).toBe("unpaid");
  });

  it("reports unpaid when there is no due date", () => {
    expect(deriveInvoiceStatus(invoice({ dueDate: null }), march19)).toBe("unpaid");
  });

  it("treats paid-due boundary as not overdue at the same day", () => {
    expect(
      deriveInvoiceStatus(invoice({ dueDate: "2026-03-19" }), march19)
    ).toBe("unpaid");
  });
});