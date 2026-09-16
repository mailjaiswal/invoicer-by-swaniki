"use client";

import * as React from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface UpiQrProps {
  /** Value to encode, typically a `upi://pay` deep link. */
  value: string;
  /** Canvas size in px (the QR scales with it). */
  size?: number;
  /** Optional label under the code. */
  label?: string;
  className?: string;
}

/**
 * Renders a QR code locally into a canvas so no calculation ever hits a
 * server (spec §19). Drawn after mount so it never blocks the first paint.
 * Colours match the invoice ink so prints stay greyscale-friendly.
 */
export function UpiQr({ value, size = 160, label, className }: UpiQrProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1c1917", light: "#ffffff" },
      },
      () => undefined
    );
  }, [value, size]);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        role="img"
        aria-label={label ?? "QR code"}
        className="rounded-xl bg-white p-2 ring-1 ring-stone-200 dark:ring-stone-700"
      />
      {label && <p className="text-center text-xs text-stone-500 dark:text-stone-400">{label}</p>}
    </div>
  );
}