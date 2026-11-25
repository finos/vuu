// Renders each artboard in source/ to png/ at 2x.
// Usage, from vuu-ui: node packages/vuu-filters/design/filter-bar/render.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(here, "source");
const pngDir = path.join(here, "png");

// The artboards are static: the <helmet> holds the page styles and the
// <x-dc> element holds the markup, so a plain page is the helmet contents
// in <head> and the markup in <body>.
const toStaticHtml = (dcHtml) => {
  const title = dcHtml.match(/<title>(.*?)<\/title>/)[1];
  const head = dcHtml.match(/<helmet>([\s\S]*?)<\/helmet>/)[1].trim();
  const body = dcHtml.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)[1].trim();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
${head}
</head>
<body>
${body}
</body>
</html>
`;
};

const canvas = JSON.parse(
  fs.readFileSync(path.join(sourceDir, "canvas.json"), "utf8"),
);
fs.mkdirSync(pngDir, { recursive: true });

const browser = await chromium.launch();
for (const name of canvas.order) {
  const { w: width, h: height } = canvas.boards[name];
  const dcHtml = fs.readFileSync(path.join(sourceDir, name), "utf8");
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  await page.setContent(toStaticHtml(dcHtml), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pngFile = path.join(pngDir, name.replace(".dc.html", ".png"));
  await page.screenshot({ path: pngFile, clip: { x: 0, y: 0, width, height } });
  await page.close();
  console.log(path.relative(here, pngFile));
}
await browser.close();
