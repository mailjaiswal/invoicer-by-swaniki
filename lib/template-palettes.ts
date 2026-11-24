/**
 * Single source of truth for per-template colour personas (spec 16, ported from
 * the InvoiceBerry / invoiceberry PDF gallery). Both the PDF engine (lib/pdf.ts)
 * and the on-screen / print preview (components/invoice/document.tsx + the
 * settings template cards) read from THIS module, so print == preview is true
 * by construction — there is no second palette that can drift.
 *
 * Colourful templates each carry their own accent + a soft table-header tint.
 * Classic and Minimal deliberately stay restrained: they only get a whisper-soft
 * neutral header wash so they keep their plain character. A user-set accent
 * colour always wins (spec: user-set accent trumps template defaults).
 */

export interface TemplatePalette {
  /** Default accent for this template (hex, no leading '#'). A user-set
   *  accentColor in settings always overrides this. */
  accent: string;
  /** Soft tint painted behind the table header row (hex, no leading '#').
   *  null keeps the header on the bare surface (restrained templates). */
  headerTint: string | null;
}

export type TemplatePalettes = Record<string, TemplatePalette>;

export const TEMPLATE_PALETTES: TemplatePalettes = {
  modern: { accent: "2563eb", headerTint: "dbeafe" },
  compact: { accent: "0d9488", headerTint: "ccfbf1" },
  bold: { accent: "334155", headerTint: "1e293b" },
  elegant: { accent: "ea580c", headerTint: "ffedd5" },
  classic: { accent: "1a6553", headerTint: "e7e5e4" },
  minimal: { accent: "1a6553", headerTint: "f4f4f5" },
  bar: { accent: "1a6553", headerTint: null },
  atelier: { accent: "1c1917", headerTint: "f5f5f4" },
  quartz: { accent: "4f46e5", headerTint: "e0e7ff" },
  nordic: { accent: "b4533c", headerTint: "efe8dc" },
  botanical: { accent: "1e3024", headerTint: "e2ebe4" },
  couture: { accent: "000000", headerTint: "f4f4f5" },
  solarpunk: { accent: "059669", headerTint: "d1fae5" },
  aura: { accent: "4338ca", headerTint: "f1f5f9" },
  swiss: { accent: "002fa7", headerTint: "ffffff" },
  noir: { accent: "d4af37", headerTint: "f4f4f5" },
  cobalt: { accent: "1e40af", headerTint: "eff6ff" },
  velvet: { accent: "064e3b", headerTint: "e6f4ea" },
} as const;

/** Fallback used when a template id is unknown or no palette exists. */
export const DEFAULT_TEMPLATE_PALETTE: TemplatePalette = TEMPLATE_PALETTES.modern;

/**
 * Resolve the effective palette entry for a template id, falling back to the
 * modern default when the id is unknown or falsy.
 */
export function paletteForTemplate(template: string | undefined | null): TemplatePalette {
  if (template && TEMPLATE_PALETTES[template]) return TEMPLATE_PALETTES[template];
  return DEFAULT_TEMPLATE_PALETTE;
}

/**
 * Resolve the final brand accent: a user-set accentColor (trimmed) always wins;
 * otherwise the template's own accent is used. Returns a hex WITHOUT the '#'.
 */
export function resolveAccent(
  userAccent: string | undefined | null,
  template?: string | undefined | null,
): string {
  const trimmed = userAccent?.trim?.();
  if (trimmed && !/#/.test(trimmed[0])) return trimmed.replace(/^#/, "");
  if (trimmed) return trimmed.replace(/^#/, "");
  return paletteForTemplate(template).accent;
}

/**
 * Choose readable text for a solid colour surface ("bar" template bands and
 * any full-strength accent fill). We compare the WCAG relative luminance of
 * the fill against the perceptual mid-grey of the sRGB transfer curve; fills
 * darker than that get white text, lighter fills get near-black ink. This is
 * exactly the user rule: "dark accent → white text, light accent → black".
 */
export function contrastTextOn(hex: string): "white" | "black" {
  const h = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-f]{6}$/i.test(h)) return "black";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.5 ? "black" : "white";
}
