"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Textarea } from "@/components/common/textarea";
import { LogoUpload } from "@/components/splash/logo-upload";
import { useApp, useToast } from "@/lib/providers";
import { PRIVACY_NOTE } from "@/lib/constants";
import type { Business } from "@/lib/types";

interface BusinessFormState {
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gstin: string;
  pan: string;
  upiId: string;
  additionalInfo: string;
}

export function BusinessForm({ initial }: { initial?: Business }) {
  const { updateBusiness } = useApp();
  const { showToast } = useToast();

  const [values, setValues] = React.useState<BusinessFormState>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    website: initial?.website ?? "",
    address: initial?.address ?? "",
    gstin: initial?.gstin ?? "",
    pan: initial?.pan ?? "",
    upiId: initial?.upiId ?? "",
    additionalInfo: initial?.additionalInfo ?? "",
  });
  const [logo, setLogo] = React.useState<string | null>(initial?.logo ?? null);
  const [saving, setSaving] = React.useState(false);

  function setField<K extends keyof BusinessFormState>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      showToast("Business name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateBusiness({
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        website: values.website.trim() || undefined,
        address: values.address.trim() || undefined,
        gstin: values.gstin.trim().toUpperCase() || undefined,
        pan: values.pan.trim().toUpperCase() || undefined,
        upiId: values.upiId.trim() || undefined,
        additionalInfo: values.additionalInfo.trim() || undefined,
        logo: logo ?? undefined,
      });
      showToast("Business details saved.", "success");
    } catch {
      showToast("Couldn't save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <LogoUpload value={logo} onChange={setLogo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" required>
          <Input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Swaniki Studios"
            maxLength={80}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="Optional"
            inputMode="tel"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Website">
          <Input
            type="url"
            value={values.website}
            onChange={(e) => setField("website", e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Address" full>
          <Textarea
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Optional"
            rows={2}
          />
        </Field>
        <Field label="GSTIN">
          <Input
            value={values.gstin}
            onChange={(e) => setField("gstin", e.target.value)}
            placeholder="Optional"
            maxLength={15}
          />
        </Field>
        <Field label="PAN">
          <Input
            value={values.pan}
            onChange={(e) => setField("pan", e.target.value)}
            placeholder="Optional"
            maxLength={10}
          />
        </Field>
        <Field label="UPI ID">
          <Input
            value={values.upiId}
            onChange={(e) => setField("upiId", e.target.value)}
            placeholder="Optional, e.g. name@okaxis"
          />
        </Field>
        <Field label="Additional business info" full>
          <Textarea
            value={values.additionalInfo}
            onChange={(e) => setField("additionalInfo", e.target.value)}
            placeholder="Optional — bank name, tagline, anything that belongs on invoices."
            rows={3}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
          {PRIVACY_NOTE}
        </p>
        <Button type="submit" disabled={saving} className="shrink-0">
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}