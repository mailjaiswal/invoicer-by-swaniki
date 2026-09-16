import { describe, expect, it } from "vitest";
import {
  buildUpiUrl,
  isValidUpiId,
  UPI_ID_PATTERN,
} from "@/lib/upi";

describe("isValidUpiId", () => {
  it("accepts a valid handle@psp address", () => {
    expect(isValidUpiId("swaniki@oksbi")).toBe(true);
    expect(isValidUpiId("a.b-c@ybl")).toBe(true);
  });

  it("rejects obviously invalid inputs", () => {
    expect(isValidUpiId()).toBe(false);
    expect(isValidUpiId(null)).toBe(false);
    expect(isValidUpiId("")).toBe(false);
    expect(isValidUpiId("upi-id")).toBe(false);
    expect(isValidUpiId("missing@")).toBe(false);
    expect(isValidUpiId("@domain")).toBe(false);
  });

  it("is a consistent regex", () => {
    expect("swaniki@oksbi").toMatch(UPI_ID_PATTERN);
    expect("user.name-abc@bank").toMatch(UPI_ID_PATTERN);
    expect("x@abc").not.toMatch(UPI_ID_PATTERN); // psp too short
  });
});

describe("buildUpiUrl", () => {
  it("builds a valid upi://pay URL with all fields", () => {
    const url = buildUpiUrl({
      id: "swaniki@oksbi",
      name: "Swaniki Studio",
      amount: 59000,
      note: "Invoice INV-0025",
    });
    expect(url).toMatch(/^upi:\/\/pay\?/);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("pa")).toBe("swaniki@oksbi");
    expect(params.get("pn")).toBe("Swaniki Studio");
    expect(params.get("am")).toBe("59000");
    expect(params.get("tn")).toBe("Invoice INV-0025");
    expect(params.get("cu")).toBe("INR");
  });

  it("omits zero, negative and NaN amounts", () => {
    for (const amount of [0, -10, NaN]) {
      const url = buildUpiUrl({ id: "a@b", amount });
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.has("am")).toBe(false);
    }
  });

  it("omits empty optional fields", () => {
    const url = buildUpiUrl({ id: "a@b", amount: 12 });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.has("pn")).toBe(false);
    expect(params.has("tn")).toBe(false);
  });

  it("URL-encodes special characters", () => {
    const url = buildUpiUrl({ id: "a@b", note: "Pay ₹100 (Jan)" });
    expect(new URLSearchParams(url.split("?")[1]).get("tn")).toBe(
      "Pay ₹100 (Jan)"
    );
  });
});