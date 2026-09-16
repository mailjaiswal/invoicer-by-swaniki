/**
 * Minimal ambient typings for pdfmake's prebuilt browser artifacts. The engine
 * is loaded lazily in the browser only (`lib/pdf.ts`), and the published
 * package ships its own build files without matching TypeScript declarations.
 */
declare module "pdfmake/build/pdfmake" {
  import type { TDocumentDefinitions, TFontDictionary } from "pdfmake";

  interface PdfMakeDocument {
    download(filename?: string): void;
    print(): void;
    getBlob(): Promise<Blob>;
    getDataUrl(): Promise<string>;
  }

  const pdfMake: {
    vfs?: Record<string, unknown>;
    fonts?: TFontDictionary;
    createPdf(documentDefinitions: TDocumentDefinitions): PdfMakeDocument;
    addFontContainer(container: unknown): void;
    setFonts(fonts: TFontDictionary): void;
  };

  export default pdfMake;
}

declare module "pdfmake/build/fonts/Roboto" {
  const fontContainer: {
    vfs: Record<string, unknown>;
    fonts: Record<string, unknown>;
  };

  export default fontContainer;
}