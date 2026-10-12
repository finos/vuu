import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { AnatomyTier } from "../../src/showcase-main/docs/anatomy/anatomy-types";
import { anatomyTargets } from "./anatomy-targets";
import {
  applyValues,
  buildAnatomy,
  formatAnatomy,
  type RawCapture,
} from "./build-anatomy";

/**
 * Captures the anatomy of components, see anatomy-targets.ts. Each target is
 * an example, loaded from a running Showcase (npm run showcase). The capture
 * (structure, variables and a screenshot) is written beside the docs that
 * show it. Run from vuu-ui:
 *
 *   npm run showcase:anatomy [-- --url http://localhost:5175 --only Table]
 */

const { values: args } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:5175" },
    theme: { type: "string", default: "vuu-theme" },
    mode: { type: "string", default: "light" },
    density: { type: "string", default: "high" },
    only: { type: "string" },
  },
});

const vuuUiDir = path.resolve(import.meta.dirname, "../../../..");
const collectDom = fs
  .readFileSync(path.resolve(import.meta.dirname, "collect-dom.js"), "utf8")
  .trim()
  .replace(/;$/, "");

const loadThemeTiers = async (theme: string) => {
  const modulePath = path.resolve(
    import.meta.dirname,
    `../../src/theme-browser/generated/${theme}.js`,
  );
  if (!fs.existsSync(modulePath)) {
    throw Error(
      `theme model ${modulePath} not found, run npm run build:theme-model`,
    );
  }
  const { model } = (await import(modulePath)) as {
    model: { tokens: Record<string, { tier: AnatomyTier }> };
  };
  return (name: string) => model.tokens[name]?.tier;
};

const main = async () => {
  const { url, theme, mode, density, only } = args;
  const themeTier = await loadThemeTiers(theme);
  const targets = anatomyTargets.filter(
    (target) => !only || target.component === only,
  );
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 900 },
    });
    for (const target of targets) {
      const exampleUrl = `${url}${target.example}?standalone&theme=${theme}#themeMode=${mode},density=${density},dataLocation=local`;
      console.log(`${target.component}: ${exampleUrl}`);
      try {
        await page.goto(exampleUrl);
      } catch (err) {
        throw Error(`cannot load ${exampleUrl}, is the Showcase running?`, {
          cause: err,
        });
      }
      const root = page.locator(target.rootSelector).first();
      await root.waitFor({ timeout: 30_000 });
      await page.evaluate("document.fonts.ready");
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1000);

      const raw = (await page.evaluate(
        `(${collectDom})(${JSON.stringify({
          rootSelector: target.rootSelector,
          prefer: target.prefer,
          nested: target.nested?.map(({ selector, name }) => ({
            selector,
            name,
          })),
        })})`,
      )) as RawCapture & { error?: string };
      if (raw.error) throw Error(raw.error);

      const { model, lookups } = buildAnatomy(raw, {
        component: target.component,
        example: target.example,
        theme,
        mode,
        density,
        themeTier,
        keepNested: Object.fromEntries(
          (target.nested ?? []).map(({ name, keep }) => [name, keep]),
        ),
      });
      const values = (await page.evaluate(
        `(${JSON.stringify(lookups.map(({ element, name }) => [element, name]))}).map(([i, name]) => getComputedStyle(window.__anatomyNodes[i]).getPropertyValue(name).trim())`,
      )) as string[];
      applyValues(lookups, values);

      const outDir = path.resolve(vuuUiDir, target.outDir);
      fs.mkdirSync(outDir, { recursive: true });
      const jsonPath = path.join(outDir, `${target.name}.anatomy.json`);
      fs.writeFileSync(jsonPath, formatAnatomy(model));
      await root.screenshot({
        animations: "disabled",
        path: path.join(outDir, `${target.name}.anatomy.png`),
      });
      const refs = model.nodes.reduce((n, node) => n + node.refs.length, 0);
      console.log(
        `  ${model.nodes.length} nodes, ${model.elements.length} elements, ${refs} declarations => ${path.relative(vuuUiDir, jsonPath)}`,
      );
    }
  } finally {
    await browser.close();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
