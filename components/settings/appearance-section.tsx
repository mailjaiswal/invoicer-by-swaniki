"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorCog, Palette, LayoutTemplate, Image as ImageIcon, Banknote, Type, FileSliders, Tags, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Select } from "@/components/common/select";
import { TemplatePreviewCard } from "@/components/settings/template-preview";
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
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            Invoice template
          </CardTitle>
          <CardDescription>
            The layout used for new invoices. Previews update live with your
            name, logo, colours and font.
          </CardDescription>
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
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
            Choose the look you want — you can still switch to another template
            on any invoice before generating it.
          </p>
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