import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgSource = readFileSync(join(root, "app", "icon.svg"), "utf8");

const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

function render(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  return resvg.render().asPng();
}

for (const size of [192, 512]) {
  writeFileSync(join(iconsDir, `icon-${size}.png`), render(svgSource, size));
  console.log(`public/icons/icon-${size}.png`);
}

// Maskable icon: content scaled to ~74% and centered inside the 48x48
// viewBox so the rounded tile fits the circular safe zone.
const MASKABLE_SCALE = 0.74;
const offset = (48 * (1 - MASKABLE_SCALE)) / 2;
const inner = svgSource
  .replace(/<\?xml[^>]*\?>\s*/s, "")
  .replace(/<title>[\s\S]*?<\/title>/s, "")
  .replace(/<svg[^>]*>/s, "")
  .replace(/<\/svg>\s*$/s, "");

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">\n  <g transform="translate(${offset} ${offset}) scale(${MASKABLE_SCALE})">\n${inner}\n  </g>\n</svg>`;

writeFileSync(join(iconsDir, "icon-maskable-512.png"), render(maskable, 512));
console.log("public/icons/icon-maskable-512.png");

writeFileSync(
  join(iconsDir, "apple-touch-icon-180.png"),
  render(svgSource, 180)
);
console.log("public/icons/apple-touch-icon-180.png");

console.log("Icons generated.");