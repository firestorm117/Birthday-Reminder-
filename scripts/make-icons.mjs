// Renders public/favicon.svg into the PNG icons the PWA manifest needs.
// Needs Playwright with Chromium available. Run with: node scripts/make-icons.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";

const svg = readFileSync("public/favicon.svg", "utf8");
const full = svg.replace('rx="112"', 'rx="0"');

const targets = [
  { file: "public/icons/icon-192.png", size: 192, src: svg, pad: 0 },
  { file: "public/icons/icon-512.png", size: 512, src: svg, pad: 0 },
  { file: "public/icons/apple-touch-icon.png", size: 180, src: full, pad: 0 },
  { file: "public/icons/icon-maskable-512.png", size: 512, src: full, pad: 0.12 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.pad));
  const offset = Math.round(t.size * t.pad);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:${t.src === svg ? "transparent" : "#E8505B"};width:${t.size}px;height:${t.size}px">
      <div style="position:absolute;left:${offset}px;top:${offset}px;width:${inner}px;height:${inner}px">
        ${t.src.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}
      </div></body></html>`,
  );
  await page.screenshot({ path: t.file, omitBackground: t.src === svg });
}
await browser.close();
