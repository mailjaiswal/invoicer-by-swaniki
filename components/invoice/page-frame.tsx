"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** A4 at 96dpi — the fixed render size of a preview page (portrait 794×1123). */
export const A4_WIDTH_PORTRAIT = 794;
export const A4_HEIGHT_PORTRAIT = 1123;
export const A4_WIDTH_LANDSCAPE = 1123;
export const A4_HEIGHT_LANDSCAPE = 794;

interface FullPagePreviewProps {
  landscape?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders its children (an invoice document) at a fixed A4 size, scales it to
 * fit the frame, and centers both axes so the page sits nicely in the panel —
 * the backdrop (per-document tint) shows around the sheet instead of dead grey
 * space. Print overrides in globals.css reset the frame/inner so documents
 * print full-size.
 */
export function FullPagePreview({
  landscape = false,
  className,
  children,
}: FullPagePreviewProps) {
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = React.useState<{
    scale: number;
    naturalHeight: number;
    frameW: number;
    frameH: number;
  }>({ scale: 0, naturalHeight: 0, frameW: 0, frameH: 0 });

  const baseWidth = landscape
    ? A4_WIDTH_LANDSCAPE
    : A4_WIDTH_PORTRAIT;
  const pageHeight = landscape
    ? A4_HEIGHT_LANDSCAPE
    : A4_HEIGHT_PORTRAIT;

  React.useLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;

    const measure = () => {
      const frameW = frame.clientWidth;
      const frameH = frame.clientHeight;
      if (!frameW || !frameH) return;
      const naturalHeight = Math.max(inner.scrollHeight, pageHeight);
      /**
       * Fill the frame's width exactly so no grey gutters show on either
       * side of the sheet. The page becomes taller than the frame, which is
       * fine — the placeholder keeps the frame scrollable to the full A4.
       */
      const scale = frameW / baseWidth;
      setLayout({ scale, naturalHeight, frameW, frameH });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [baseWidth, pageHeight]);

  const usableScale = layout.scale || 1;
  const scaledW = baseWidth * usableScale;
  const scaledH = layout.naturalHeight * usableScale;
  const offsetX = Math.max(0, (layout.frameW - scaledW) / 2);
  const offsetTop = Math.max(0, (layout.frameH - scaledH) / 2);
  const displayHeight = layout.naturalHeight * usableScale;

  return (
    <div
      ref={frameRef}
      className={cn(
        "page-frame relative w-full overflow-hidden bg-stone-100/80",
        className
      )}
    >
      <div
        ref={innerRef}
        className="page-frame-inner absolute"
        style={{
          left: offsetX,
          top: offsetTop,
          width: baseWidth,
          minHeight: pageHeight,
          transform: `scale(${usableScale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="print:hidden"
        style={{ height: displayHeight }}
      />
    </div>
  );
}
