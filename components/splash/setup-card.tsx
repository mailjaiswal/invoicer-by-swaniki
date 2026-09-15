"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { LogoUpload } from "@/components/splash/logo-upload";
import { PRIVACY_NOTE } from "@/lib/constants";
import { useApp, useToast } from "@/lib/providers";

interface Field {
  key: keyof BusinessFields;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url";
}

interface BusinessFields {
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gstin: string;
  upiId: string;
}

const FIELDS: Field[] = [
  { key: "name", label: "Business name", placeholder: "e.g. Swaniki Studios", required: true, inputMode: "text" },
  { key: "phone", label: "Phone", placeholder: "Optional", inputMode: "tel" },
  { key: "email", label: "Email", placeholder: "Optional", type: "email", inputMode: "email" },
  { key: "website", label: "Website", placeholder: "Optional", type: "url", inputMode: "url" },
  { key: "address", label: "Address", placeholder: "Optional" },
  { key: "gstin", label: "GSTIN", placeholder: "Optional" },
  { key: "upiId", label: "UPI ID", placeholder: "Optional, e.g. name@okaxis" },
];

export function SetupCard() {
  const router = useRouter();
  const { updateBusiness } = useApp();
  const { showToast } = useToast();
  const [values, setValues] = React.useState<BusinessFields>({
    name: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    gstin: "",
    upiId: "",
  });
  const [logo, setLogo] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function setField(key: keyof BusinessFields, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  async function handleSubmit() {
    if (!values.name.trim()) {
      setError("Add your business name to continue.");
      return;
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setError("That email address doesn't look right.");
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
        upiId: values.upiId.trim() || undefined,
        logo: logo ?? undefined,
      });
      showToast("Welcome to Invoicer by Swaniki", "success");
      router.push("/home");
    } catch {
      setError("Something went wrong while saving. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-stone-50 px-4 py-10 dark:bg-stone-950">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            Welcome to Invoicer by Swaniki
          </h1>
          <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
            Create professional invoices in seconds.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="space-y-4"
            noValidate
          >
            <LogoUpload value={logo} onChange={setLogo} />

            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`setup-${field.key}`}>
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 text-red-500" aria-hidden="true">
                      *
                    </span>
                  )}
                </Label>
                <Input
                  id={`setup-${field.key}`}
                  type={field.type ?? "text"}
                  inputMode={field.inputMode}
                  autoComplete="off"
                  placeholder={field.placeholder}
                  value={values[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  aria-required={field.required}
                  maxLength={field.key === "name" ? 80 : undefined}
                />
              </div>
            ))}

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={saving}
            >
              {saving ? "Setting up…" : "Start Creating Invoices"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
            Only your business name is required — you can add the rest anytime
            in Settings. {PRIVACY_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}