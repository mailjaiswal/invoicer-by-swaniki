"use client";

import { useEffect, useRef, useState } from "react";
import {
  MonitorCog,
  Palette,
  LayoutTemplate,
  Image as ImageIcon,
  Banknote,
  Type,
  FileSliders,
  Tags,
  FileText,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Select } from "@/components/common/select";
import {
  TemplatePreviewCard,
  TemplatePreviewModal,
} from "@/components/settings/template-preview";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Textarea } from "@/components/common/textarea";
import { useApp, useToast } from "@/lib/providers";
import {
  ACCENT_COLOR_SWATCHES,
  CURRENCIES,
  DEFAULT_ACCENT_COLOR,
  DOC_FONTS,
  INVOICE_PERSONALITIES,
  INVOICE_TEMPLATES,
  LOGO_POSITIONS,
  GRADIENT_PRESETS,
  type CurrencyCode,
  type DocFontId,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { InvoicePersonality, InvoiceTemplateId } from "@/lib/types";
import type { LogoPosition } from "@/lib/constants";
import type { PageOrientation } from "@/lib/types";

/**
 * A locally-edited text field (debounced save). While the field is dirty the
 * stored (live-query) value is never written back, so typing never gets
 * clobbered by a pending IndexedDB save completing.
 */
function useLocalText(
  serverValue: string,
  save: (value: string) => void,
  delay = 600
) {
  const [value, setValue] = useState(serverValue);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const [adoptedServerValue, setAdoptedServerValue] = useState(serverValue);

  if (adoptedServerValue !== serverValue) {
    setAdoptedServerValue(serverValue);
    if (!dirty) setValue(serverValue);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const commit = (next: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    pendingRef.current = next;
    Promise.resolve(save(next)).finally(() => {
      if (pendingRef.current === next) setDirty(false);
    });
  };

  const onChange = (next: string) => {
    setDirty(true);
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), delay);
  };

  const flush = () => {
    if (timer.current) commit(value);
  };

  return { value, onChange, flush };
}

export function AppearanceSection() {
  const { business, settings, updateBusiness, updateSettings } = useApp();
  const { showToast } = useToast();

  const template = (INVOICE_TEMPLATES.some(
    (t) => t.id === settings?.defaultTemplate
  )
    ? settings?.defaultTemplate
    : "modern") as InvoiceTemplateId;
  const personality =
    settings?.personality ?? "professional";
  const accent = settings?.accentColor || DEFAULT_ACCENT_COLOR;
  const logoPosition = business?.logoPosition || "left";
  const currency = settings?.currency ?? "INR";
  const docFont = settings?.docFont ?? "roboto";

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalTemplateId, setPreviewModalTemplateId] =
    useState<InvoiceTemplateId>(template);

  const setTemplate = (value: string) => {
    const id = value as InvoiceTemplateId;
    if (!INVOICE_TEMPLATES.some((t) => t.id === id)) return;
    updateSettings({ defaultTemplate: id })
      .then(() => showToast("Invoice template saved.", "success"))
      .catch(() => showToast("Couldn't save the template.", "error"));
  };

  const setPersonality = (value: string) => {
    const id = value as InvoicePersonality;
    if (!INVOICE_PERSONALITIES.some((p) => p.id === id)) return;
    updateSettings({ personality: id })
      .then(() => showToast("Invoice style saved.", "success"))
      .catch(() => showToast("Couldn't save the style.", "error"));
  };

  const setAccent = (color: string) => {
    updateSettings({ accentColor: color })
      .then(() => showToast("Accent color saved.", "success"))
      .catch(() => showToast("Couldn't save the accent color.", "error"));
  };

  const setLogoPosition = (value: string) => {
    const id = value as LogoPosition;
    if (!LOGO_POSITIONS.some((p) => p.id === id)) return;
    updateBusiness({ logoPosition: id })
      .then(() => showToast("Logo placement saved.", "success"))
      .catch(() => showToast("Couldn't save the logo placement.", "error"));
  };

  const setCurrency = (value: string) => {
    const id = value as CurrencyCode;
    if (!(id in CURRENCIES)) return;
    updateSettings({ currency: id })
      .then(() => showToast("Invoice currency saved.", "success"))
      .catch(() => showToast("Couldn't save the currency.", "error"));
  };

  const setDocFont = (value: string) => {
    const id = value as DocFontId;
    if (!DOC_FONTS.some((f) => f.id === id)) return;
    updateSettings({ docFont: id })
      .then(() => showToast("Invoice font saved.", "success"))
      .catch(() => showToast("Couldn't save the font.", "error"));
  };

  const orientation = settings?.pageOrientation ?? "portrait";

  const setOrientation = (value: string) => {
    const id = value as PageOrientation;
    if (id !== "portrait" && id !== "landscape") return;
    updateSettings({ pageOrientation: id })
      .then(() => showToast("Page orientation saved.", "success"))
      .catch(() => showToast("Couldn't save the orientation.", "error"));
  };

  const notesLabel = useLocalText(settings?.notesLabel || "Notes", (label) =>
    updateSettings({
      notesLabel: label.trim() || "Notes",
    })
      .then(() => showToast("Section label saved.", "success"))
      .catch(() => showToast("Couldn't save the label.", "error"))
  );

  const termsLabel = useLocalText(settings?.termsLabel || "Terms", (label) =>
    updateSettings({
      termsLabel: label.trim() || "Terms",
    })
      .then(() => showToast("Section label saved.", "success"))
      .catch(() => showToast("Couldn't save the label.", "error"))
  );

  const defaultNotes = useLocalText(
    settings?.defaultNotes ?? "",
    (value) =>
      updateSettings({ defaultNotes: value.trim() })
        .then(() => showToast("Default notes saved.", "success"))
        .catch(() => showToast("Couldn't save the default notes.", "error"))
  );

  const defaultTerms = useLocalText(
    settings?.defaultTerms ?? "",
    (value) =>
      updateSettings({ defaultTerms: value })
        .then(() => showToast("Default terms saved.", "success"))
        .catch(() => showToast("Couldn't save the default terms.", "error"))
  );

  const badgeText = useLocalText(
    settings?.templateBadgeText ?? "",
    (val) =>
      updateSettings({ templateBadgeText: val })
        .then(() => showToast("Badge text saved.", "success"))
        .catch(() => showToast("Couldn't save badge text.", "error"))
  );

  const toggleHideBadge = (hide: boolean) => {
    updateSettings({ hideTemplateBadge: hide })
      .then(() => showToast(hide ? "Header badge hidden." : "Header badge visible.", "success"))
      .catch(() => showToast("Couldn't update badge visibility.", "error"));
  };

  const setGradientPreset = (from: string, to: string) => {
    updateSettings({
      headerGradientFrom: from,
      headerGradientTo: to,
    })
      .then(() => showToast("Header gradient updated.", "success"))
      .catch(() => showToast("Couldn't save gradient.", "error"));
  };

  const clearGradient = () => {
    updateSettings({
      headerGradientFrom: "",
      headerGradientTo: "",
    })
      .then(() => showToast("Reset to template default colors.", "success"))
      .catch(() => showToast("Couldn't reset gradient.", "error"));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorCog className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            App theme
          </CardTitle>
          <CardDescription>
            How Invoicer by Swaniki looks on this device. Invoices and PDFs
            always use a clean white document background.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ThemeToggle />
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Your theme preference is stored on this device only.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                Invoice template
              </CardTitle>
              <CardDescription>
                The layout used for new invoices. Previews update live with your
                name, logo, colours and font.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewModalTemplateId(template);
                setPreviewModalOpen(true);
              }}
              className="self-start sm:self-auto gap-1.5 text-xs font-semibold"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span>Full-Page Gallery</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INVOICE_TEMPLATES.map((t) => (
              <TemplatePreviewCard
                key={t.id}
                templateId={t.id}
                label={t.label}
                blurb={t.blurb}
                active={template === t.id}
                business={business}
                settings={settings}
                onSelect={setTemplate}
                onPreview={(id) => {
                  setPreviewModalTemplateId(id);
                  setPreviewModalOpen(true);
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
            Choose the look you want — click any template to open a large, scrollable full-page preview.
          </p>
        </CardContent>
      </Card>

      <TemplatePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        initialTemplateId={previewModalTemplateId}
        currentTemplateId={template}
        onSelect={(id) => {
          setTemplate(id);
          setPreviewModalOpen(false);
        }}
        business={business}
        settings={settings}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
              Template Styling &amp; Customization
            </CardTitle>
            {(settings?.headerGradientFrom || settings?.templateBadgeText || settings?.hideTemplateBadge) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateSettings({
                    headerGradientFrom: "",
                    headerGradientTo: "",
                    templateBadgeText: "",
                    hideTemplateBadge: false,
                  }).then(() => showToast("Reset template styling to default.", "success"));
                }}
                className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400"
              >
                Reset to Default
              </Button>
            )}
          </div>
          <CardDescription>
            Customize the header colors, gradients, and badge text across modern, velvet, aura, cobalt, and banner templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Badge text & visibility */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="badge-text" className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Header Badge / Subtitle Text
              </Label>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-stone-500 hover:text-stone-700 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={settings?.hideTemplateBadge ?? false}
                  onChange={(e) => toggleHideBadge(e.target.checked)}
                  className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Hide badge completely</span>
              </label>
            </div>
            <Input
              id="badge-text"
              value={badgeText.value}
              onChange={(e) => badgeText.onChange(e.target.value)}
              onBlur={badgeText.flush}
              disabled={settings?.hideTemplateBadge}
              placeholder="e.g. Swaniki Studio, Verified Engineering, Consulting Partner (leave blank for default)"
              className="text-sm"
            />
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              Replaces default template text like &quot;Sustainable Enterprise&quot; or &quot;Studio Invoice&quot;.
            </p>
          </div>

          {/* Header Gradients */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Header Gradient (Velvet, Aura, Cobalt, Solarpunk, Modern)
              </Label>
              {settings?.headerGradientFrom && settings?.headerGradientTo && (
                <button
                  type="button"
                  onClick={clearGradient}
                  className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                >
                  Use Template Default
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((preset) => {
                const isActive =
                  settings?.headerGradientFrom?.toLowerCase() === preset.from.toLowerCase() &&
                  settings?.headerGradientTo?.toLowerCase() === preset.to.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setGradientPreset(preset.from, preset.to)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/30 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200"
                        : "border-stone-200 bg-white hover:border-stone-300 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${preset.from} 0%, ${preset.to} 100%)`,
                      }}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Gradient picker */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-3 dark:border-stone-800 dark:bg-stone-900/40">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Custom Gradient:</span>
              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                <span>From</span>
                <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg ring-1 ring-stone-300 dark:ring-stone-600">
                  <Input
                    type="color"
                    value={settings?.headerGradientFrom || "#7C3AED"}
                    onChange={(e) =>
                      updateSettings({
                        headerGradientFrom: e.target.value,
                        headerGradientTo: settings?.headerGradientTo || "#10B981",
                      })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Gradient start color"
                  />
                  <span
                    className="h-full w-full"
                    style={{ backgroundColor: settings?.headerGradientFrom || "#7C3AED" }}
                  />
                </span>
                <span className="font-mono text-[11px] text-stone-500">
                  {settings?.headerGradientFrom || "#7C3AED"}
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                <span>To</span>
                <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg ring-1 ring-stone-300 dark:ring-stone-600">
                  <Input
                    type="color"
                    value={settings?.headerGradientTo || "#10B981"}
                    onChange={(e) =>
                      updateSettings({
                        headerGradientFrom: settings?.headerGradientFrom || "#7C3AED",
                        headerGradientTo: e.target.value,
                      })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Gradient end color"
                  />
                  <span
                    className="h-full w-full"
                    style={{ backgroundColor: settings?.headerGradientTo || "#10B981" }}
                  />
                </span>
                <span className="font-mono text-[11px] text-stone-500">
                  {settings?.headerGradientTo || "#10B981"}
                </span>
              </label>

              {/* Preview strip */}
              <div
                className="h-7 min-w-[80px] flex-1 rounded-lg border border-black/10 shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${settings?.headerGradientFrom || "#7C3AED"} 0%, ${settings?.headerGradientTo || "#10B981"} 100%)`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Invoice font
          </CardTitle>
          <CardDescription>
            The typeface used on invoices and PDFs. Fonts are embedded
            directly into the PDF so they work fully offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={docFont} onChange={(e) => setDocFont(e.target.value)} aria-label="Invoice font">
            {DOC_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {DOC_FONTS.find((f) => f.id === docFont)?.blurb}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Invoice currency
          </CardTitle>
          <CardDescription>
            The default currency for new invoices. You can still track local
            payment methods in your business details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Invoice currency">
            {Object.entries(CURRENCIES).map(([code, cfg]) => (
              <option key={code} value={code}>
                {code} · {cfg.symbol}
              </option>
            ))}
          </Select>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            UPI payments remain INR-native; other currencies are for
            invoicing and records.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Accent color
          </CardTitle>
          <CardDescription>
            Used for headings, highlights and the PDF — with a restrained
            palette so invoices stay professional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAccent(color)}
                aria-label={`Use accent ${color}`}
                aria-pressed={accent.toLowerCase() === color}
                className={cn(
                  "h-9 w-9 rounded-full ring-offset-2 transition-transform hover:scale-105 dark:ring-offset-stone-900",
                  accent.toLowerCase() === color
                    ? "ring-2 ring-brand-600"
                    : "ring-1 ring-stone-300 dark:ring-stone-600"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <label className="ml-1 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-stone-300 dark:ring-stone-600">
                <Input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Pick a custom accent color"
                />
                <span
                  className="h-full w-full"
                  style={{ backgroundColor: accent }}
                />
              </span>
              Custom
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Logo placement
          </CardTitle>
          <CardDescription>
            Where your logo appears on invoices and PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={logoPosition}
            onChange={(e) => setLogoPosition(e.target.value)}
            aria-label="Logo placement"
          >
            {LOGO_POSITIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.label}
              </option>
            ))}
          </Select>
          {!business?.logo && logoPosition !== "none" && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              You haven&apos;t uploaded a logo yet — add one in the Business
              tab and it will appear here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorCog className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Invoice style
          </CardTitle>
          <CardDescription>
            A light tone-lift applied on top of the template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={personality} onChange={(e) => setPersonality(e.target.value)} aria-label="Invoice style">
            {INVOICE_PERSONALITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {INVOICE_PERSONALITIES.find((p) => p.id === personality)?.blurb}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSliders className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Page setup
          </CardTitle>
          <CardDescription>
            The paper orientation used for printed and downloaded invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            aria-label="Page orientation"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </Select>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Portrait is a standard A4 page; landscape gives line items more
            room to breathe. Applies to every invoice you print or download.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Section labels
          </CardTitle>
          <CardDescription>
            What the notes and terms blocks at the bottom of an invoice are
            called. Name them anything you like.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes-label">Notes heading</Label>
            <Input
              id="notes-label"
              placeholder="Notes"
              value={notesLabel.value}
              onChange={(e) => notesLabel.onChange(e.target.value)}
              onBlur={notesLabel.flush}
            />
            <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
              e.g. Notes, Message, Instructions, Payment info
            </p>
          </div>
          <div>
            <Label htmlFor="terms-label">Terms heading</Label>
            <Input
              id="terms-label"
              placeholder="Terms"
              value={termsLabel.value}
              onChange={(e) => termsLabel.onChange(e.target.value)}
              onBlur={termsLabel.flush}
            />
            <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
              e.g. Terms, Policy, Deadline, Conditions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Section content
          </CardTitle>
          <CardDescription>
            Saved default text that pre-fills the notes and terms blocks on
            every new invoice and quotation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="default-notes">Default notes</Label>
            <Textarea
              id="default-notes"
              rows={3}
              placeholder="e.g. Thanks for your business!"
              value={defaultNotes.value}
              onChange={(e) => defaultNotes.onChange(e.target.value)}
              onBlur={defaultNotes.flush}
            />
            <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
              Shown on every new document; you can still edit it before
              generating.
            </p>
          </div>
          <div>
            <Label htmlFor="default-terms">Default terms</Label>
            <Textarea
              id="default-terms"
              rows={3}
              placeholder="e.g. Payment due within 15 days."
              value={defaultTerms.value}
              onChange={(e) => defaultTerms.onChange(e.target.value)}
              onBlur={defaultTerms.flush}
            />
            <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
              Shown on every new document; you can still edit or remove it per
              document.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}