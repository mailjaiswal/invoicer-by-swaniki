import type {
  AppSettings,
  Business,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
} from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/formatting";
import { taxLabel } from "@/lib/calculations";
import { buildReceiptNumber } from "@/lib/print";
import { buildUpiUrl, isValidUpiId } from "@/lib/upi";
import QRCode from "qrcode";

type PdfMakeModule = typeof import("pdfmake/build/pdfmake").default;

let pdfMakeApi: PdfMakeModule | undefined;

/**
 * Load pdfmake lazily and only in the browser. The engine (and its embedded
 * Roboto font, which covers the rupee sign) ships as a normal asset, so it
 * works offline inside the installed PWA without slowing the first paint.
 */
async function getPdfMake(): Promise<PdfMakeModule> {
  if (pdfMakeApi) return pdfMakeApi;
  const mod = (await import("pdfmake/build/pdfmake")) as unknown;
  const api =
    (mod as { default?: PdfMakeModule })?.default ?? (mod as PdfMakeModule);
  const fonts = (await import("pdfmake/build/fonts/Roboto")) as unknown;
  const container = (fonts as { default: unknown })?.default ?? fonts;
  api.addFontContainer(container);
  pdfMakeApi = api;
  return pdfMakeApi;
}

/** Safe PDF file name from an invoice/receipt number (letters, digits, dash). */
export function buildPdfFileName(prefix: string): string {
  const safe = String(prefix ?? "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");
  return `${safe || "document"}.pdf`;
}

const INK = "#1c1917";
const MUTED = "#57534e";
const FAINT = "#a8a29e";
const BRAND = "#1a6553";
const PAPER = "#fafaf9";
const HEADER_FILL = "#f5f5f4";
const LINE = "#e7e5e4";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: MUTED,
  unpaid: "#b45309",
  partial: "#b45309",
  paid: BRAND,
  overdue: "#b91c1c",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

const CARD_LAYOUT = {
  hLineWidth: () => 0.7,
  vLineWidth: () => 0.7,
  hLineColor: () => LINE,
  vLineColor: () => LINE,
  paddingLeft: () => 14,
  paddingRight: () => 14,
  paddingTop: () => 10,
  paddingBottom: () => 12,
};

function margin(top = 0, right = 0, bottom = 0, left = 0): [number, number, number, number] {
  return [top, right, bottom, left];
}

function sectionLabel(text: string) {
  return {
    text,
    fontSize: 8,
    bold: false,
    characterSpacing: 0.8,
    color: FAINT,
    margin: margin(0, 0, 4),
  };
}

function smallLines(lines: Array<string | undefined>, color = MUTED) {
  return {
    fontSize: 8.5,
    lineHeight: 1.35,
    color,
    text: lines.filter(Boolean).join("\n") || " ",
  };
}

function card(stack: unknown[]) {
  return {
    table: {
      widths: ["*"],
      body: [[{ fillColor: PAPER, stack }]],
    },
    layout: CARD_LAYOUT,
  };
}

/** Build the pdfmake document definition for an invoice (pure, renderable). */
export function buildInvoiceDocDef(
  invoice: Invoice,
  business?: Business,
  settings?: AppSettings,
  options: { upiQrDataUrl?: string } = {},
): Record<string, unknown> {
  const currency = settings?.currency ?? "INR";
  const money = (amount: number) => formatMoney(amount, currency);
  const number = invoice.invoiceNumber || "Preview";
  const status = invoice.status ?? "draft";

  const taxRows: Array<{ label: string; amount: number }> = [];
  if (invoice.taxBreakup.cgst)
    taxRows.push({ label: "CGST", amount: invoice.taxBreakup.cgst });
  if (invoice.taxBreakup.sgst)
    taxRows.push({ label: "SGST", amount: invoice.taxBreakup.sgst });
  if (invoice.taxBreakup.igst)
    taxRows.push({ label: "IGST", amount: invoice.taxBreakup.igst });
  if (invoice.taxBreakup.amount)
    taxRows.push({ label: "Tax", amount: invoice.taxBreakup.amount });

  const totalRows: Array<{
    label: string;
    value: string;
    bold?: boolean;
    color?: string;
  }> = [
    { label: "Subtotal", value: money(invoice.subtotal) },
    ...(invoice.discount > 0
      ? [{ label: "Discount", value: `−${money(invoice.discount)}` }]
      : []),
    ...(invoice.taxTotal > 0
      ? [
          { label: "Taxable amount", value: money(invoice.taxableAmount) },
          ...taxRows.map((row) => ({ label: row.label, value: money(row.amount) })),
        ]
      : []),
    { label: "Total", value: money(invoice.total), bold: true },
    ...(invoice.payment.amountPaid > 0
      ? [
          { label: "Amount paid", value: money(invoice.payment.amountPaid), color: BRAND },
          { label: "Balance due", value: money(invoice.payment.balance), bold: true },
        ]
      : []),
  ];

  return {
    pageSize: "A4",
    pageMargins: [36, 36, 36, 32] as [number, number, number, number],
    info: {
      title: `Invoice ${number}`,
      author: business?.name || "Invoicer by Swaniki",
      subject: invoice.customerSnapshot.name || undefined,
    },
    defaultStyle: { fontSize: 9, color: INK },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: business?.name?.trim() || "Your Business",
                fontSize: 18,
                bold: true,
                color: INK,
              },
              {
                text: business?.address?.trim() || " ",
                fontSize: 8.5,
                lineHeight: 1.35,
                color: MUTED,
                margin: margin(3, 0, 0),
              },
              smallLines([
                business?.email,
                business?.phone,
                business?.gstin?.trim()
                  ? `GSTIN: ${business.gstin.toUpperCase()}`
                  : undefined,
              ]),
            ],
          },
          {
            width: 170,
            stack: [
              { text: "INVOICE", fontSize: 22, bold: true, color: BRAND, alignment: "right" },
              { text: number, fontSize: 11, bold: true, alignment: "right", margin: margin(3, 0, 0) },
              {
                text: `Issued: ${invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"}`,
                fontSize: 8.5,
                color: MUTED,
                alignment: "right",
                margin: margin(7, 0, 1),
              },
              {
                text: `Due: ${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}`,
                fontSize: 8.5,
                color: MUTED,
                alignment: "right",
              },
              {
                text: (STATUS_LABELS[status] ?? "Draft").toUpperCase(),
                fontSize: 8.5,
                bold: true,
                color: STATUS_COLORS[status] ?? STATUS_COLORS.draft,
                alignment: "right",
                margin: margin(8, 0, 0),
              },
            ],
          },
        ],
        columnGap: 16,
        margin: margin(0, 0, 18),
      },

      {
        ...card([
          sectionLabel("BILLED TO"),
          {
            text: invoice.customerSnapshot.name || "Customer",
            fontSize: 10,
            bold: true,
            color: INK,
          },
          ...(invoice.customerSnapshot.company?.trim()
            ? [{ text: invoice.customerSnapshot.company, fontSize: 8.5, color: MUTED }]
            : []),
          smallLines([
            invoice.customerSnapshot.email,
            invoice.customerSnapshot.phone,
            invoice.customerSnapshot.address,
          ]),
        ]),
        margin: margin(0, 0, 18),
      },

      {
        table: {
          headerRows: 1,
          widths: ["*", 32, 74, 62, 44, 84],
          body: [
            [
              { text: "Description", bold: true, color: MUTED, fontSize: 8 },
              { text: "Qty", bold: true, color: MUTED, alignment: "right", fontSize: 8 },
              { text: "Rate", bold: true, color: MUTED, alignment: "right", fontSize: 8 },
              { text: "Tax", bold: true, color: MUTED, alignment: "right", fontSize: 8 },
              { text: "Disc", bold: true, color: MUTED, alignment: "right", fontSize: 8 },
              { text: "Amount", bold: true, color: MUTED, alignment: "right", fontSize: 8 },
            ],
            ...invoice.items.map((item) => [
              {
                stack: [
                  { text: item.name || "Untitled item", bold: true, fontSize: 9, color: INK },
                  ...(item.description
                    ? [
                        {
                          text: item.description,
                          fontSize: 8,
                          color: MUTED,
                          margin: margin(1, 0, 0),
                        },
                      ]
                    : []),
                ],
              },
              {
                text: `${trimNumber(item.quantity)}${item.unit ? ` ${item.unit}` : ""}`,
                alignment: "right",
              },
              { text: money(item.rate), alignment: "right" },
              { text: taxLabel(item.taxType, item.taxRate), alignment: "right" },
              { text: item.discount ? `${trimNumber(item.discount)}%` : "—", alignment: "right" },
              { text: money(item.lineTotal), alignment: "right" },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.3,
          vLineWidth: () => 0,
          hLineColor: () => LINE,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 6,
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? HEADER_FILL : null,
        },
        margin: margin(0, 0, 2),
      },

      {
        columns: [
          { width: "*", text: "" },
          {
            width: 250,
            stack: totalRows.map((row) => ({
              margin: margin(6, 0, 0),
              columns: [
                {
                  text: row.label,
                  width: "*",
                  color: row.bold ? INK : MUTED,
                  bold: !!row.bold,
                  fontSize: row.bold ? 11 : 9,
                },
                {
                  text: row.value,
                  width: "auto",
                  color: row.color ?? INK,
                  bold: !!row.bold,
                  fontSize: row.bold ? 12 : 9,
                },
              ],
            })),
          },
        ],
        columnGap: 20,
        margin: margin(20, 0, 0),
      },

      ...(invoice.notes?.trim() || invoice.terms?.trim()
        ? [
            {
              columns: [
                ...(invoice.notes?.trim()
                  ? [
                      {
                        width: "*",
                        stack: [
                          sectionLabel("NOTES"),
                          { text: invoice.notes, margin: margin(3, 0, 0) },
                        ],
                      },
                    ]
                  : []),
                ...(invoice.terms?.trim()
                  ? [
                      {
                        width: "*",
                        stack: [
                          sectionLabel("TERMS"),
                          { text: invoice.terms, margin: margin(3, 0, 0) },
                        ],
                      },
                    ]
                  : []),
              ],
              columnGap: 20,
              margin: margin(22, 0, 0),
            },
          ]
        : []),

      ...(options?.upiQrDataUrl && business?.upiId
        ? [
            {
              image: options.upiQrDataUrl,
              width: 120,
              height: 120,
              alignment: "center",
              margin: margin(22, 0, 0),
            },
            {
              text: `Pay via UPI: ${business.upiId}`,
              alignment: "center",
              fontSize: 8,
              color: MUTED,
              margin: margin(4, 0, 0),
            },
          ]
        : []),
    ],
  };
}

/**
 * Build a local UPI QR for an invoice when the business has enabled it.
 * Encodes the UPI ID, payee name, invoice amount and reference; returns
 * undefined when UPI isn't configured or enabled (spec §19).
 */
export async function buildUpiQrDataUrl(
  invoice: Invoice,
  business?: Business,
): Promise<string | undefined> {
  const upiId = business?.upiId?.trim();
  if (!business?.showUpiQr || !upiId || !isValidUpiId(upiId)) return undefined;
  const note = invoice.invoiceNumber
    ? `Invoice ${invoice.invoiceNumber}`
    : undefined;
  const url = buildUpiUrl({
    id: upiId,
    name: business.name,
    amount: invoice.total,
    note,
  });
  try {
    return await QRCode.toDataURL(url, { width: 240, margin: 1 });
  } catch {
    return undefined;
  }
}

/** Generate and trigger a download of the invoice PDF. */
export async function generateInvoicePdf(
  invoice: Invoice,
  business?: Business,
  settings?: AppSettings,
): Promise<void> {
  const pdfMake = await getPdfMake();
  const upiQrDataUrl = await buildUpiQrDataUrl(invoice, business);
  pdfMake
    .createPdf(buildInvoiceDocDef(invoice, business, settings, { upiQrDataUrl }))
    .download(buildPdfFileName(invoice.invoiceNumber || "Preview"));
}

export interface InvoicePdfFile {
  blob: Blob;
  name: string;
}

/**
 * Render the invoice PDF to an in-memory Blob (no download), so it can be
 * attached to a native share sheet or re-used elsewhere.
 */
export async function renderInvoicePdfFile(
  invoice: Invoice,
  business?: Business,
  settings?: AppSettings,
): Promise<InvoicePdfFile> {
  const pdfMake = await getPdfMake();
  const upiQrDataUrl = await buildUpiQrDataUrl(invoice, business);
  const name = buildPdfFileName(invoice.invoiceNumber || "Preview");
  const blob = await pdfMake
    .createPdf(buildInvoiceDocDef(invoice, business, settings, { upiQrDataUrl }))
    .getBlob();
  return { blob, name };
}

/** Build the pdfmake document definition for a payment receipt (pure). */
export function buildReceiptDocDef(
  invoice: Invoice,
  business?: Business,
  settings?: AppSettings,
): Record<string, unknown> {
  const currency = settings?.currency ?? "INR";
  const money = (amount: number) => formatMoney(amount, currency);
  const receiptNumber = buildReceiptNumber(invoice.invoiceNumber);
  const amountReceived = invoice.payment.amountPaid;
  const paidAt = invoice.payment.paidAt ? new Date(invoice.payment.paidAt) : null;
  const methodLabel = invoice.payment.method
    ? METHOD_LABELS[invoice.payment.method] ?? invoice.payment.method
    : "N/A";

  const detailRows = [
    { label: "Amount received", value: money(amountReceived) },
    { label: "Payment method", value: methodLabel },
    { label: "Date", value: paidAt ? formatDate(paidAt) : "—" },
    { label: "Reference", value: invoice.payment.reference || "—" },
  ];

  return {
    pageSize: "A4",
    pageMargins: [36, 36, 36, 32] as [number, number, number, number],
    info: {
      title: `Receipt ${receiptNumber}`,
      author: business?.name || "Invoicer by Swaniki",
      subject: invoice.customerSnapshot.name || undefined,
    },
    defaultStyle: { fontSize: 9, color: INK },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: business?.name?.trim() || "Your Business",
                fontSize: 18,
                bold: true,
                color: INK,
              },
              smallLines([business?.email, business?.phone, business?.address]),
            ],
          },
          {
            width: 170,
            stack: [
              { text: "RECEIPT", fontSize: 22, bold: true, color: BRAND, alignment: "right" },
              { text: receiptNumber, fontSize: 11, bold: true, alignment: "right", margin: margin(3, 0, 0) },
              ...(paidAt
                ? [
                    {
                      text: `Paid: ${formatDate(paidAt)}`,
                      fontSize: 8.5,
                      color: MUTED,
                      alignment: "right",
                      margin: margin(7, 0, 1),
                    },
                  ]
                : []),
              {
                text: `Against invoice: ${invoice.invoiceNumber}`,
                fontSize: 8.5,
                color: MUTED,
                alignment: "right",
              },
            ],
          },
        ],
        columnGap: 16,
        margin: margin(0, 0, 18),
      },

      {
        columns: [
          {
            width: "*",
            ...card([
              sectionLabel("RECEIVED FROM"),
              {
                text: invoice.customerSnapshot.name || "Customer",
                fontSize: 10,
                bold: true,
                color: INK,
              },
              ...(invoice.customerSnapshot.company?.trim()
                ? [{ text: invoice.customerSnapshot.company, fontSize: 8.5, color: MUTED }]
                : []),
            ]),
          },
          {
            width: "*",
            stack: [
              sectionLabel("AMOUNT RECEIVED"),
              { text: money(amountReceived), fontSize: 22, bold: true, color: BRAND },
              { text: `via ${methodLabel}`, fontSize: 8.5, color: MUTED, margin: margin(3, 0, 0) },
            ],
            margin: margin(0, 0, 0, 16),
          },
        ],
        margin: margin(0, 0, 18),
      },

      {
        ...card(
          detailRows.map((row) => ({
            margin: margin(3, 0, 0),
            columns: [
              { text: row.label, width: "*", color: MUTED },
              { text: row.value, width: "auto", color: INK, bold: true },
            ],
          })),
        ),
        margin: margin(0, 0, 18),
      },

      ...(invoice.notes?.trim()
        ? [
            {
              columns: [
                {
                  width: "*",
                  stack: [sectionLabel("NOTES"), { text: invoice.notes, margin: margin(3, 0, 0) }],
                },
              ],
            },
          ]
        : []),

      {
        text: "Generated with Invoicer by Swaniki · free, offline & privacy-first",
        fontSize: 8,
        color: FAINT,
        alignment: "center",
        margin: margin(24, 0, 0),
      },
    ],
  };
}

/** Generate and trigger a download of the payment receipt PDF. */
export async function generateReceiptPdf(
  invoice: Invoice,
  business?: Business,
  settings?: AppSettings,
): Promise<void> {
  const pdfMake = await getPdfMake();
  pdfMake
    .createPdf(buildReceiptDocDef(invoice, business, settings))
    .download(buildPdfFileName(buildReceiptNumber(invoice.invoiceNumber)));
}

function trimNumber(value: number): string {
  const num = Number.isFinite(value) ? value : 0;
  return Number.isInteger(num)
    ? String(num)
    : Number(num.toFixed(2)).toString();
}