"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/providers";
import { resizeLogoFile } from "@/lib/logo";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const { showToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const resized = await resizeLogoFile(file);
      onChange(resized);
      showToast("Logo added.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Couldn't process that logo.",
        "error"
      );
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-stone-50 dark:bg-stone-800",
          value ? "border-stone-200 dark:border-stone-700" : "border-stone-300 dark:border-stone-700"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Business logo" className="h-full w-full object-contain" />
        ) : (
          <ImagePlus className="h-6 w-6 text-stone-400" aria-hidden="true" />
        )}
      </div>
      <div className="space-x-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          id="logo-upload"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          {value ? "Change" : "Upload logo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            aria-label="Remove logo"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}