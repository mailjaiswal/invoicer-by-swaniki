/**
 * Sharing helpers: prefilled WhatsApp messages, deep links, clipboard and the
 * Web Share API. No messages are ever sent automatically (spec §22, §23).
 */

export type ShareMessageStyle =
  | "professional"
  | "friendly"
  | "short"
  | "gentle_reminder"
  | "final_reminder";

export const INVOICE_MESSAGE_STYLES: Array<{
  value: ShareMessageStyle;
  label: string;
}> = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "short", label: "Short" },
];

export const REMINDER_MESSAGE_STYLES: Array<{
  value: ShareMessageStyle;
  label: string;
}> = [
  { value: "gentle_reminder", label: "Gentle" },
  { value: "professional", label: "Professional" },
  { value: "short", label: "Short" },
  { value: "final_reminder", label: "Final" },
];

export interface MessageContext {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: string;
  businessName?: string;
  /** Document word for the message copy; "invoice" by default, "quotation" for quotations. */
  docWord?: string;
}

/** First word of a name, used for a warm greeting, e.g. "Raj" from "Raj Sharma". */
export function customerFirstName(name: string): string {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function sign(businessName?: string): string {
  return businessName?.trim() ? `\n— ${businessName.trim()}` : "";
}

export function buildInvoiceMessage(
  style: "professional" | "friendly" | "short",
  ctx: MessageContext,
): string {
  const firstName = customerFirstName(ctx.customerName);
  const word = ctx.docWord ?? "invoice";
  const due = ctx.dueDate ? ` It is due by ${ctx.dueDate}.` : "";
  switch (style) {
    case "professional":
      return (
        `Dear ${firstName},\n\n` +
        `Your ${word} ${ctx.invoiceNumber} for ${ctx.amount} is ready.` +
        `${due}\n\nThank you for your business.${sign(ctx.businessName)}`
      );
    case "friendly":
      return (
        `Hi ${firstName}! 👋\n\n` +
        `Your ${word} ${ctx.invoiceNumber} for ${ctx.amount} is ready.` +
        `${due}\n\nThanks a lot${sign(ctx.businessName)}`
      );
    case "short":
      return (
        `${word.charAt(0).toUpperCase() + word.slice(1)} ${ctx.invoiceNumber} for ${ctx.amount}.` +
        `${due.split(" It is")[1] ?? ""}${sign(ctx.businessName)}`
      );
  }
}

export function buildReminderMessage(
  style: "gentle_reminder" | "professional" | "short" | "final_reminder",
  ctx: MessageContext,
): string {
  const firstName = customerFirstName(ctx.customerName);
  const due = ctx.dueDate ? ` due on ${ctx.dueDate}` : " due";
  switch (style) {
    case "gentle_reminder":
      return (
        `Hi ${firstName},\n\n` +
        `Just a gentle reminder that invoice ${ctx.invoiceNumber} for ${ctx.amount}` +
        ` is still open — it was${due}. Let me know if you need anything!\n\n` +
        `Thanks${sign(ctx.businessName)}`
      );
    case "professional":
      return (
        `Dear ${firstName},\n\n` +
        `This is a reminder that invoice ${ctx.invoiceNumber} for ${ctx.amount}` +
        ` remains unpaid. The amount was${due}.\n\n` +
        `Please arrange payment at your earliest convenience.\n\n` +
        `Regards${sign(ctx.businessName)}`
      );
    case "short":
      return (
        `Reminder: invoice ${ctx.invoiceNumber} for ${ctx.amount} is${due}.${sign(ctx.businessName)}`
      );
    case "final_reminder":
      return (
        `Dear ${firstName},\n\n` +
        `This is a final reminder — invoice ${ctx.invoiceNumber} for ${ctx.amount}` +
        ` was${due} and still shows as unpaid.\n\n` +
        `Please settle this amount so we can close it out.\n\n` +
        `Thank you${sign(ctx.businessName)}`
      );
  }
}

/** WhatsApp ID from a phone number: digits only, prepend country code if bare. */
export function normalizeWhatsAppPhone(phone?: string): string {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.length >= 10 && digits.length <= 12 ? digits : "";
}

/** `https://wa.me/<phone>?text=<message>` (or the general share link). */
export function buildWhatsAppUrl(message: string, phone?: string): string {
  const digits = normalizeWhatsAppPhone(phone);
  const url = digits
    ? new URL(`https://wa.me/${digits}`)
    : new URL("https://wa.me/");
  url.searchParams.set("text", message);
  return url.toString();
}

/** Copy text to the clipboard with a legacy fallback. Returns success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }
  try {
    if (typeof document === "undefined") return false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Whether the Web Share API is available in this browser. */
export function canNativeShare(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export interface NativeSharePayload {
  title?: string;
  text: string;
  url?: string;
  /** Optional PDF file to attach (shared only when the OS supports files). */
  file?: File;
}

/**
 * Share via the system sheet. Returns false when sharing isn't available or
 * the user cancelled.
 */
export async function shareNative(
  payload: NativeSharePayload,
): Promise<boolean> {
  if (!canNativeShare()) return false;
  const data: ShareData = {
    title: payload.title,
    text: payload.text,
  };
  if (payload.url) data.url = payload.url;
  if (payload.file && navigator.canShare?.({ files: [payload.file] })) {
    data.files = [payload.file];
  }
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return true;
    return false;
  }
}