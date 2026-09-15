async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;
export const LOGO_MAX_DIMENSION = 256;

export async function resizeLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG or WebP).");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("That image is too large. Please use one under 5 MB.");
  }

  const src = await readFileAsDataURL(file);
  const img = await loadImage(src);

  const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser can't process images.");
  }
  ctx.drawImage(img, 0, 0, width, height);

  const output = canvas.toDataURL("image/png");
  return output;
}