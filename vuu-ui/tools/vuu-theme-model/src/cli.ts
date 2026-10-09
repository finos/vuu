#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildThemeModel } from "./build-theme-model.ts";

const { values } = parseArgs({
  options: {
    entry: { type: "string", short: "e" },
    out: { type: "string", short: "o" },
    name: { type: "string", short: "n" },
    fallback: { type: "string", short: "f", multiple: true },
    pretty: { type: "boolean", short: "p", default: false },
    verbose: { type: "boolean", short: "v", default: false },
  },
});

if (!values.entry) {
  console.error(
    "usage: vuu-theme-model --entry <theme-next.css> [--fallback <theme.css>] [--out model.json] [--name theme-name] [--pretty] [--verbose]",
  );
  process.exit(1);
}

const start = performance.now();
const model = buildThemeModel({
  entry: values.entry,
  fallback: values.fallback,
  name: values.name,
});
const elapsed = Math.round(performance.now() - start);

const json = `${JSON.stringify(model, null, values.pretty ? 2 : undefined)}\n`;
if (values.out) {
  fs.mkdirSync(path.dirname(values.out), { recursive: true });
  fs.writeFileSync(values.out, json);
} else {
  process.stdout.write(json);
}

const log = values.out ? console.log : console.error;
const tokens = Object.values(model.tokens);
const countByTier = (tier: string) =>
  tokens.filter((t) => t.tier === tier && t.layer !== "legacy").length;
const legacyCount = tokens.filter((t) => t.layer === "legacy").length;
log(
  `[vuu-theme-model] ${model.name}: ${tokens.length} tokens (foundations ${countByTier("foundations")}, palette ${countByTier("palette")}, characteristics ${countByTier("characteristics")}, legacy fallback ${legacyCount}), ${model.scopes.length} scopes, axes [${model.axes.map((a) => `${a.name}: ${a.values.join("|")}`).join(", ")}], ${model.diagnostics.length} diagnostics in ${elapsed}ms${values.out ? ` => ${values.out}` : ""}`,
);
if (values.verbose) {
  for (const d of model.diagnostics) {
    log(`  ${d.type}: ${d.message}`);
  }
}
