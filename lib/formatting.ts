import {
  CURRENCIES,
  type CurrencyCode,
} from "@/lib/constants";

export function formatMoney(
  amount: number,
  currency: CurrencyCode = "INR"
): string {
  const config = CURRENCIES[currency] ?? CURRENCIES.INR;
  const digits = config.digits ?? 2;
  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(amount);
    return formatted;
  } catch {
    return `${config.symbol}${amount.toLocaleString("en-IN")}`;
  }
}

export function formatINR(amount: number): string {
  return formatMoney(amount, "INR");
}

export function formatCompact(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(iso: string | number | Date): string {
  const date = typeof iso === "number" ? new Date(iso) : new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function greetingForHour(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}