#!/usr/bin/env node
/**
 * salt-theme-audit
 *
 * Compares a custom theme derived from the Salt theme (@salt-ds/theme) with
 * the latest Salt theme, and reports what is needed to bring it up to date.
 * It also identifies broken, missing and unused CSS variables.
 *
 * Self-contained: requires only Node 18+ (and npm when Salt versions are
 * given by version number). Copy it into any project and run it.
 *
 * Examples
 *
 *   # Compare with the Salt theme installed in ./node_modules
 *   node salt-theme-audit.mjs --theme src/theme --src src
 *
 *   # Three-way comparison: the theme was cloned from Salt 1.37.0, compare
 *   # with 1.47.0, and write a markdown report
 *   node salt-theme-audit.mjs --theme src/theme --base 1.37.0 --salt 1.47.0 \
 *     --src src --out theme-audit.md
 *
 * Run with --help for all options.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const HELP = `Usage: node salt-theme-audit.mjs --theme <path> [options]

Inputs
  --theme <path>         Custom theme CSS file or directory (repeatable). Required.
  --salt <spec>          Latest Salt theme to compare with: a version (e.g. 1.47.0,
                         latest), a @salt-ds/theme package directory, a Salt source
                         css directory, or a CSS file.
                         Default: @salt-ds/theme in --node-modules.
  --base <spec>          Salt theme the custom theme was originally derived from
                         (same forms as --salt). Enables three-way comparison:
                         upstream changes to apply, conflicts and removed tokens.
  --src <path>           Application source to scan for token usage (repeatable).
  --node-modules <dir>   Where to find @salt-ds packages. Default: ./node_modules
  --no-components        Don't treat Salt component CSS as token consumers.

Interpretation
  --variant <next|legacy>  Salt theme variant. Default: next (css/theme-next.css).
  --mode <clone|overlay>   clone: the custom theme replaces the Salt theme (default).
                           overlay: the custom theme is loaded on top of the Salt
                           theme and only overrides some tokens.
  --prefix <prefix>        Prefix of the theme tokens. Default: --salt-
  --root-class <class>     Extra theme root class to ignore when comparing
                           selectors (repeatable). Classes ending in -theme or
                           -theme-next are ignored automatically.
  --exclude <regex>        Ignore --src files whose path matches (repeatable).

Output
  --format <md|json>     Default: md
  --out <file>           Write the report to a file instead of stdout.
  --strict               Exit with code 1 if broken or undefined tokens are found.
  --help
`;

const { values: args } = parseArgs({
  options: {
    theme: { type: "string", multiple: true },
    salt: { type: "string" },
    base: { type: "string" },
    src: { type: "string", multiple: true, default: [] },
    "node-modules": { type: "string", default: "node_modules" },
    "no-components": { type: "boolean", default: false },
    variant: { type: "string", default: "next" },
    mode: { type: "string", default: "clone" },
    prefix: { type: "string", default: "--salt-" },
    "root-class": { type: "string", multiple: true, default: [] },
    exclude: { type: "string", multiple: true, default: [] },
    format: { type: "string", default: "md" },
    out: { type: "string" },
    strict: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (args.help || !args.theme?.length) {
  console.log(HELP);
  process.exit(args.help ? 0 : 1);
}
if (!["next", "legacy"].includes(args.variant)) fail("--variant must be next or legacy");
if (!["clone", "overlay"].includes(args.mode)) fail("--mode must be clone or overlay");
if (!["md", "json"].includes(args.format)) fail("--format must be md or json");

function fail(message) {
  console.error(`salt-theme-audit: ${message}`);
  process.exit(2);
}

const PREFIX = args.prefix;
const excludes = args.exclude.map((re) => new RegExp(re));
const isExcluded = (file) => excludes.some((re) => re.test(file));
const rel = (file) => {
  const relative = path.relative(process.cwd(), file);
  return relative && !relative.startsWith("..") ? relative : file;
};

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", "dist", "dist-es", "build", "coverage", "out", "test-results", "playwright-report"]);

function walk(root, extensions, files = []) {
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    files.push(root);
    return files;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) walk(full, extensions, files);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// CSS parsing
// ---------------------------------------------------------------------------

const SOURCE_MARKER = /^\/\*\s*(css\/[^\s*]+\.css)\s*\*\/$/;
const SKIPPED_AT_RULES = new Set(["keyframes", "font-face", "property", "counter-style", "page", "font-feature-values"]);

/**
 * Parses CSS into declarations: { prop, value, selectors, at, file, line, source }.
 * Handles comments, strings, nested at-rules and CSS nesting. `source` is the
 * original Salt file when the CSS is a Salt bundle with "/* css/... *\/" markers.
 */
function parseCss(text, file) {
  // Blank out comments (keeping newlines) and remember bundle source markers.
  const markers = [];
  let clean = "";
  for (let i = 0; i < text.length; ) {
    const ch = text[i];
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      const comment = text.slice(i, stop);
      const marker = SOURCE_MARKER.exec(comment);
      if (marker) markers.push({ pos: i, source: marker[1] });
      clean += comment.replace(/[^\n]/g, " ");
      i = stop;
    } else if (ch === '"' || ch === "'") {
      const start = i++;
      while (i < text.length && text[i] !== ch) i += text[i] === "\\" ? 2 : 1;
      i++;
      clean += text.slice(start, i);
    } else {
      clean += ch;
      i++;
    }
  }

  const lineStarts = [0];
  for (let i = 0; i < clean.length; i++) if (clean[i] === "\n") lineStarts.push(i + 1);
  const lineAt = (pos) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const sourceAt = (pos) => {
    let source;
    for (const marker of markers) {
      if (marker.pos > pos) break;
      source = marker.source;
    }
    return source;
  };

  const skipString = (i) => {
    const quote = clean[i++];
    while (i < clean.length && clean[i] !== quote) i += clean[i] === "\\" ? 2 : 1;
    return i + 1;
  };
  const matchingBrace = (open) => {
    let depth = 0;
    for (let i = open; i < clean.length; ) {
      const ch = clean[i];
      if (ch === '"' || ch === "'") {
        i = skipString(i);
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) return i;
      i++;
    }
    return clean.length;
  };

  const decls = [];
  const addDeclaration = (start, end, selectors, at) => {
    const raw = clean.slice(start, end);
    const colon = raw.indexOf(":");
    if (colon === -1 || !selectors) return;
    const prop = raw.slice(0, colon).trim();
    if (!prop) return;
    let value = raw.slice(colon + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, "").trim();
    const offset = start + raw.length - raw.trimStart().length;
    decls.push({ prop, value, important, selectors, at, file, line: lineAt(offset), source: sourceAt(offset) });
  };

  const parseBody = (start, end, selectors, at) => {
    let segment = start;
    let parens = 0;
    for (let i = start; i < end; ) {
      const ch = clean[i];
      if (ch === '"' || ch === "'") {
        i = skipString(i);
        continue;
      }
      if (ch === "(") parens++;
      else if (ch === ")") parens = Math.max(0, parens - 1);
      else if (ch === ";" && parens === 0) {
        addDeclaration(segment, i, selectors, at);
        segment = i + 1;
      } else if (ch === "{" && parens === 0) {
        const close = matchingBrace(i);
        const prelude = clean.slice(segment, i).trim();
        if (prelude.startsWith("@")) {
          const name = /^@([\w-]+)/.exec(prelude)?.[1]?.toLowerCase() ?? "";
          if (!SKIPPED_AT_RULES.has(name) && !name.endsWith("keyframes")) {
            parseBody(i + 1, close, selectors, [...at, prelude.replace(/\s+/g, " ")]);
          }
        } else if (prelude) {
          parseBody(i + 1, close, combineSelectors(selectors, splitTopLevel(prelude, ",")), at);
        }
        i = close + 1;
        segment = i;
        continue;
      }
      i++;
    }
    if (clean.slice(segment, end).trim()) addDeclaration(segment, end, selectors, at);
  };

  parseBody(0, clean.length, null, []);
  return decls;
}

function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === separator && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

function combineSelectors(parents, children) {
  if (!parents) return children;
  const combined = [];
  for (const parent of parents) {
    for (const child of children) {
      combined.push(child.includes("&") ? child.replaceAll("&", parent) : `${parent} ${child}`);
    }
  }
  return combined;
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const extraRootClasses = new Set(args["root-class"].map((c) => c.replace(/^\./, "")));
const seenRootClasses = new Set();
const isRootClass = (name) =>
  extraRootClasses.has(name) || /^([\w-]+-)?theme(-next)?$/.test(name) || /^[\w-]+-theme(-next)?$/.test(name);

const SELECTOR_PART = /(\.[\w-]+)|(\[[^\]]*\])|(#[\w-]+)|(::?[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)|([\w-]+|\*)|(\s*[>+~]\s*|\s+)/g;

/**
 * Reduces a selector to the context in which a token applies, e.g.
 * ".salt-theme.salt-theme-next.my-theme[data-mode='dark']" -> "[data-mode=dark]".
 * Theme root classes are dropped so themes with different root classes compare.
 */
function contextOf(selector, at) {
  const compounds = [[]];
  for (const match of selector.trim().matchAll(SELECTOR_PART)) {
    const [part, cls, attr, id, pseudo, element, combinator] = match;
    if (combinator !== undefined) {
      const symbol = combinator.trim();
      if (compounds.at(-1).length) compounds.push([]);
      if (symbol) compounds.at(-1).push(`${symbol}`);
      continue;
    }
    if (cls) {
      const name = cls.slice(1);
      if (isRootClass(name)) {
        if (!name.startsWith("salt-")) seenRootClasses.add(name);
        continue;
      }
      compounds.at(-1).push(cls);
    } else if (attr) {
      compounds.at(-1).push(
        attr.replace(/\s+/g, "").replace(/=(["'])([^"']*)\1/, (_, __, v) => (/\s/.test(v) ? `="${v}"` : `=${v}`)),
      );
    } else if (pseudo === ":root" || element === "html" || element === "body") {
      continue;
    } else {
      compounds.at(-1).push(id ?? pseudo ?? element ?? part);
    }
  }
  const context = compounds
    .filter((c) => c.length && !(c.length === 1 && /^[>+~]$/.test(c[0])))
    .map((c) => {
      const combinator = /^[>+~]$/.test(c[0]) ? `${c.shift()} ` : "";
      return combinator + c.sort().join("");
    })
    .join(" ");
  return [...at, context].filter(Boolean).join(" ") || "base";
}

const contextParts = (context) => context.split(/(?=[.[#:])|\s+/).filter(Boolean);
/** True when a definition in context `general` also applies in context `specific`. */
const covers = (general, specific) => {
  if (general === "base") return true;
  const parts = new Set(contextParts(specific));
  return contextParts(general).every((p) => parts.has(p));
};

const normaliseValue = (value) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/'/g, '"')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, (m) => m.toLowerCase())
    .replace(/(^|[^\w.])\.(\d)/g, "$10.$2")
    .trim();

const VAR_REF = /var\(\s*(--[\w-]+)\s*(,)?/g;
const refsOf = (value) => [...value.matchAll(VAR_REF)].map((m) => ({ name: m[1], fallback: Boolean(m[2]) }));

// ---------------------------------------------------------------------------
// Theme model
// ---------------------------------------------------------------------------

/**
 * tokens: Map<name, Map<context, { value, raw, file, line, source }>>
 * consumers: declarations that use tokens without defining theme tokens
 */
function buildTheme(label, files) {
  const tokens = new Map();
  const consumers = [];
  for (const file of files) {
    const decls = parseCss(fs.readFileSync(file, "utf8"), file);
    for (const decl of decls) {
      const isToken = decl.prop.startsWith(PREFIX);
      if (!isToken) {
        consumers.push(decl);
        // Non-theme custom properties (component tokens etc.) are also definitions.
        if (!decl.prop.startsWith("--")) continue;
      }
      for (const selector of decl.selectors) {
        const context = contextOf(selector, decl.at);
        if (!tokens.has(decl.prop)) tokens.set(decl.prop, new Map());
        tokens.get(decl.prop).set(context, {
          value: normaliseValue(decl.value),
          raw: decl.value,
          file: decl.file,
          line: decl.line,
          source: decl.source,
        });
      }
    }
  }
  return { label, files, tokens, consumers };
}

const themeTokens = (theme) => [...theme.tokens.keys()].filter((t) => t.startsWith(PREFIX));

// ---------------------------------------------------------------------------
// Resolving Salt theme sources
// ---------------------------------------------------------------------------

const cacheDir = path.join(os.tmpdir(), "salt-theme-audit");

function fetchSaltVersion(version) {
  const dir = path.join(cacheDir, version);
  const pkgDir = path.join(dir, "package");
  if (version !== "latest" && fs.existsSync(path.join(pkgDir, "package.json"))) return pkgDir;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  let tarball;
  try {
    tarball = execFileSync(npm, ["pack", `@salt-ds/theme@${version}`, "--pack-destination", dir, "--silent"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .trim()
      .split("\n")
      .at(-1);
  } catch (err) {
    fail(`unable to download @salt-ds/theme@${version}: ${err.stderr || err.message}`);
  }
  execFileSync("tar", ["-xzf", path.join(dir, tarball), "-C", dir]);
  return pkgDir;
}

/** Returns { label, files } for a Salt theme spec. */
function resolveSalt(spec, role) {
  const variantFile = args.variant === "next" ? "theme-next.css" : "theme.css";
  let target = spec;
  if (!target) {
    target = path.join(args["node-modules"], "@salt-ds", "theme");
    if (!fs.existsSync(target)) fail(`no ${role} Salt theme given and ${target} not found; use --${role}`);
  } else if (!fs.existsSync(target) && /^(\d|latest|next|\^|~)/.test(target)) {
    target = fetchSaltVersion(target);
  }
  if (!fs.existsSync(target)) fail(`${role} Salt theme not found: ${spec}`);

  let version;
  const pkgJson = path.join(target, "package.json");
  if (fs.existsSync(pkgJson)) version = JSON.parse(fs.readFileSync(pkgJson, "utf8")).version;

  const label = (file) => (file.startsWith(cacheDir) ? `@salt-ds/theme@${version} (npm)` : rel(file));
  if (fs.statSync(target).isFile()) return { label: label(target), version, files: [target] };
  for (const candidate of [path.join(target, "css", variantFile), path.join(target, variantFile)]) {
    if (fs.existsSync(candidate)) return { label: label(candidate), version, files: [candidate] };
  }
  // Salt source tree: every css file except the other variant
  const other = args.variant === "next" ? `${path.sep}legacy${path.sep}` : `${path.sep}next${path.sep}`;
  const files = walk(target, [".css"]).filter((f) => !f.includes(other) && !f.includes(`${path.sep}components${path.sep}`));
  if (!files.length) fail(`no css found for ${role} Salt theme in ${target}`);
  return { label: rel(target), version, files };
}

// ---------------------------------------------------------------------------
// Consumers: Salt component CSS and application source
// ---------------------------------------------------------------------------

function componentCssFiles() {
  if (args["no-components"]) return [];
  const scope = path.join(args["node-modules"], "@salt-ds");
  if (!fs.existsSync(scope)) return [];
  const files = [];
  for (const pkg of fs.readdirSync(scope)) {
    if (pkg === "theme") continue;
    const cssDir = path.join(scope, pkg, "css");
    if (fs.existsSync(cssDir)) files.push(...walk(cssDir, [".css"]));
    else if (fs.existsSync(path.join(scope, pkg, "dist-es"))) files.push(...walk(path.join(scope, pkg, "dist-es"), [".css.js"]));
  }
  return files;
}

const SOURCE_EXTENSIONS = [".css", ".scss", ".less", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".html"];

/** Usage: { name, file, line, kind: "var" | "string" | "dynamic", fallback } */
function scanUsages(files, themeFiles) {
  const usages = [];
  const definitions = new Set();
  const prefixRe = PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenRe = new RegExp(`(var\\(\\s*)?(${prefixRe}[\\w-]*)(\\$\\{)?(\\s*,)?(["'\`]?\\s*:)?`, "g");
  for (const file of files) {
    if (themeFiles.has(path.resolve(file)) || isExcluded(file)) continue;
    const isCss = /\.(css|scss|less)$/.test(file) && !file.endsWith(".css.js");
    const text = fs.readFileSync(file, "utf8");
    if (isCss) {
      for (const m of text.matchAll(/(--[\w-]+)\s*:/g)) definitions.add(m[1]);
    }
    const lines = text.split("\n");
    lines.forEach((lineText, index) => {
      for (const m of lineText.matchAll(tokenRe)) {
        const [, isVar, name, interpolation, fallback, colon] = m;
        const dynamic = Boolean(interpolation) || name.endsWith("-");
        if (!isVar && colon && !dynamic) continue; // a definition, not a usage
        if (isCss && !isVar) continue;
        usages.push({
          name,
          file,
          line: index + 1,
          kind: dynamic ? "dynamic" : isVar ? "var" : "string",
          fallback: Boolean(fallback),
        });
      }
    });
  }
  return { usages, definitions };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function similarity(a, b) {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return 1 - prev[n] / Math.max(m, n);
}

function closest(name, candidates, limit = 2, threshold = 0.7) {
  return candidates
    .map((c) => ({ c, score: similarity(name, c) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c);
}

/** The custom definition that applies in `context`: exact match, else the most specific covering one. */
function definitionFor(contexts, context) {
  if (!contexts) return undefined;
  if (contexts.has(context)) return contexts.get(context);
  let best;
  let bestSize = -1;
  for (const [ctx, def] of contexts) {
    if (covers(ctx, context)) {
      const size = ctx === "base" ? 0 : contextParts(ctx).length;
      if (size > bestSize) {
        best = def;
        bestSize = size;
      }
    }
  }
  return best;
}

const isDeprecatedDef = (def) => /deprecated/.test(def?.source ?? def?.file ?? "");
const saltSourceOf = (contexts) => [...(contexts?.values() ?? [])].find((d) => d.source)?.source ?? "(unknown)";

function analyse() {
  const themeFiles = args.theme.flatMap((t) => walk(path.resolve(t), [".css"]));
  if (!themeFiles.length) fail("no CSS files found in --theme");
  const custom = buildTheme("custom", themeFiles);

  const latestSrc = resolveSalt(args.salt, "salt");
  const latest = buildTheme("latest", latestSrc.files);
  const baseSrc = args.base ? resolveSalt(args.base, "base") : undefined;
  const base = baseSrc ? buildTheme("base", baseSrc.files) : undefined;

  const componentFiles = componentCssFiles();
  const srcFiles = args.src.flatMap((s) => walk(path.resolve(s), SOURCE_EXTENSIONS));
  const themeFileSet = new Set(themeFiles.map((f) => path.resolve(f)));
  const components = scanUsages(componentFiles, themeFileSet);
  const app = scanUsages(srcFiles, themeFileSet);

  const customNames = new Set(themeTokens(custom));
  const latestNames = new Set(themeTokens(latest));
  const baseNames = base ? new Set(themeTokens(base)) : undefined;
  const latestList = [...latestNames];

  const allCustomDefs = new Set(custom.tokens.keys());
  const isDefined = (name) =>
    allCustomDefs.has(name) ||
    app.definitions.has(name) ||
    (args.mode === "overlay" && latest.tokens.has(name));

  // Usages within the theme itself: declarations that aren't theme tokens
  // (e.g. global.css rules, component overrides, component tokens).
  const themeUsages = [];
  for (const decl of custom.consumers) {
    for (const ref of refsOf(decl.value)) {
      themeUsages.push({ name: ref.name, file: decl.file, line: decl.line, kind: "var", fallback: ref.fallback });
    }
  }

  // 1. Broken references inside theme token definitions
  const broken = [];
  const brokenNames = new Set();
  for (const [name, contexts] of custom.tokens) {
    for (const [context, def] of contexts) {
      for (const ref of refsOf(def.raw)) {
        if (!isDefined(ref.name) && !ref.fallback) {
          broken.push({ token: name, context, ref: ref.name, file: def.file, line: def.line, inSalt: latest.tokens.has(ref.name), suggestions: latest.tokens.has(ref.name) ? [] : closest(ref.name, latestList) });
          brokenNames.add(name);
        }
      }
    }
  }
  // Tokens that only resolve through a broken token
  const indirectlyBroken = new Map();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, contexts] of custom.tokens) {
      if (brokenNames.has(name) || indirectlyBroken.has(name)) continue;
      for (const def of contexts.values()) {
        const via = refsOf(def.raw).find((r) => !r.fallback && (brokenNames.has(r.name) || indirectlyBroken.has(r.name)));
        if (via) {
          indirectlyBroken.set(name, via.name);
          changed = true;
          break;
        }
      }
    }
  }

  // 2. Undefined tokens used by consumers
  const dynamicPrefixes = [...components.usages, ...app.usages].filter((u) => u.kind === "dynamic").map((u) => u.name);
  const undefinedUsed = new Map();
  const collectUndefined = (usages, origin) => {
    for (const usage of usages) {
      if (usage.kind === "dynamic") {
        if (![...customNames].some((n) => n.startsWith(usage.name))) {
          const entry = undefinedUsed.get(usage.name) ?? { name: usage.name, dynamic: true, locations: [] };
          entry.locations.push({ origin, file: usage.file, line: usage.line, fallback: usage.fallback });
          undefinedUsed.set(usage.name, entry);
        }
        continue;
      }
      if (!usage.name.startsWith(PREFIX) || isDefined(usage.name)) continue;
      const entry = undefinedUsed.get(usage.name) ?? { name: usage.name, locations: [] };
      entry.locations.push({ origin, file: usage.file, line: usage.line, fallback: usage.fallback });
      undefinedUsed.set(usage.name, entry);
    }
  };
  collectUndefined(components.usages, "salt");
  collectUndefined(app.usages, "app");
  collectUndefined(themeUsages, "theme");
  for (const entry of undefinedUsed.values()) {
    const latestDef = latest.tokens.get(entry.name);
    entry.inSalt = Boolean(latestDef);
    entry.deprecatedInSalt = latestDef ? [...latestDef.values()].every(isDeprecatedDef) : false;
    entry.suggestions = entry.inSalt || entry.dynamic ? [] : closest(entry.name, latestList);
  }

  // 3. Missing tokens (clone mode): defined by Salt but not by the custom theme
  const usedNames = new Set([...components.usages, ...app.usages, ...themeUsages].map((u) => u.name));
  const missing = [];
  if (args.mode === "clone") {
    for (const name of latestNames) {
      if (customNames.has(name)) continue;
      const contexts = latest.tokens.get(name);
      missing.push({
        token: name,
        source: saltSourceOf(contexts),
        deprecated: [...contexts.values()].every(isDeprecatedDef),
        newInSalt: baseNames ? !baseNames.has(name) : undefined,
        used: usedNames.has(name),
        values: [...contexts].map(([context, def]) => ({ context, value: def.raw })),
      });
    }
  }

  // 4. Contexts (mode, density, accent ...) that the custom theme doesn't cover
  const missingContexts = [];
  if (args.mode === "clone") {
    for (const name of customNames) {
      const latestContexts = latest.tokens.get(name);
      if (!latestContexts) continue;
      const customContexts = custom.tokens.get(name);
      for (const [context, def] of latestContexts) {
        if (!definitionFor(customContexts, context)) {
          missingContexts.push({ token: name, context, saltValue: def.raw, definedIn: [...customContexts.keys()] });
        }
      }
    }
  }

  // 5. Value comparison
  const toApply = [];
  const conflicts = [];
  const customised = [];
  let upToDate = 0;
  for (const name of customNames) {
    const latestContexts = latest.tokens.get(name);
    if (!latestContexts) continue;
    const customContexts = custom.tokens.get(name);
    for (const [context, latestDef] of latestContexts) {
      const customDef = definitionFor(customContexts, context);
      if (!customDef) continue;
      const baseDef = base ? definitionFor(base.tokens.get(name), context) : undefined;
      const row = {
        token: name,
        context,
        custom: customDef.raw,
        salt: latestDef.raw,
        base: baseDef?.raw,
        file: customDef.file,
        line: customDef.line,
      };
      if (customDef.value === latestDef.value) {
        upToDate++;
      } else if (base && baseDef && baseDef.value !== latestDef.value) {
        if (customDef.value === baseDef.value) toApply.push(row);
        else conflicts.push(row);
      } else {
        customised.push(row);
      }
    }
  }

  // 6. Tokens the custom theme defines that Salt latest doesn't
  const removed = [];
  for (const name of customNames) {
    if (latestNames.has(name)) continue;
    const contexts = custom.tokens.get(name);
    const def = [...contexts.values()][0];
    let suggestions = [];
    if (baseNames?.has(name)) {
      // Prefer new tokens whose latest value matches the removed token's base value
      const baseValues = new Set([...base.tokens.get(name).values()].map((d) => d.value));
      const added = latestList.filter((n) => !baseNames.has(n));
      const byValue = added.filter((n) => [...latest.tokens.get(n).values()].some((d) => baseValues.has(d.value)));
      suggestions = [...closest(name, byValue, 2, 0.5), ...closest(name, added)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
    } else {
      suggestions = closest(name, latestList);
    }
    removed.push({
      token: name,
      removedUpstream: baseNames ? baseNames.has(name) : undefined,
      used: usedNames.has(name) || [...custom.tokens.values()].some((ctxs) => [...ctxs.values()].some((d) => refsOf(d.raw).some((r) => r.name === name))),
      file: def.file,
      line: def.line,
      suggestions,
    });
  }

  // 7. Deprecated Salt tokens that the custom theme or application still uses
  const deprecated = [];
  for (const name of new Set([...usedNames, ...customNames])) {
    const contexts = latest.tokens.get(name);
    if (!contexts || ![...contexts.values()].every(isDeprecatedDef)) continue;
    // Deprecated tokens that are only defined (not referenced) show up as unused instead
    const replacement = [...new Set([...contexts.values()].flatMap((d) => refsOf(d.raw).map((r) => r.name)))];
    const appUses = app.usages.filter((u) => u.name === name).length;
    const themeUses = [...custom.tokens.values()].reduce(
      (n, ctxs) => n + [...ctxs.values()].filter((d) => refsOf(d.raw).some((r) => r.name === name)).length,
      themeUsages.filter((u) => u.name === name).length,
    );
    const saltUses = components.usages.filter((u) => u.name === name).length;
    if (appUses + themeUses + saltUses === 0) continue;
    deprecated.push({ token: name, replacement, appUses, themeUses, saltUses });
  }

  // 8. Unused tokens: not reachable from any consumer
  const reachable = new Set();
  const queue = [...usedNames];
  for (const prefix of dynamicPrefixes) for (const name of customNames) if (name.startsWith(prefix)) queue.push(name);
  while (queue.length) {
    const name = queue.pop();
    if (reachable.has(name)) continue;
    reachable.add(name);
    for (const def of custom.tokens.get(name)?.values() ?? []) for (const ref of refsOf(def.raw)) queue.push(ref.name);
  }
  // Non-theme custom properties defined by the theme are consumers too
  for (const [name, contexts] of custom.tokens) {
    if (name.startsWith(PREFIX)) continue;
    for (const def of contexts.values()) for (const ref of refsOf(def.raw)) if (!reachable.has(ref.name)) {
      queue.push(ref.name);
    }
  }
  while (queue.length) {
    const name = queue.pop();
    if (reachable.has(name)) continue;
    reachable.add(name);
    for (const def of custom.tokens.get(name)?.values() ?? []) for (const ref of refsOf(def.raw)) queue.push(ref.name);
  }
  const unused = [...customNames]
    .filter((n) => !reachable.has(n))
    .map((token) => ({ token, inSalt: latestNames.has(token), deprecatedInSalt: latestNames.has(token) && [...latest.tokens.get(token).values()].every(isDeprecatedDef) }));

  return {
    inputs: {
      mode: args.mode,
      variant: args.variant,
      prefix: PREFIX,
      theme: { files: themeFiles.length, tokens: customNames.size, rootClasses: [...seenRootClasses].sort() },
      salt: { source: latestSrc.label, version: latestSrc.version, tokens: latestNames.size },
      base: baseSrc ? { source: baseSrc.label, version: baseSrc.version, tokens: baseNames.size } : undefined,
      components: { files: componentFiles.length, usages: components.usages.length },
      app: { files: srcFiles.length, usages: app.usages.length },
    },
    broken,
    indirectlyBroken: [...indirectlyBroken].map(([token, via]) => ({ token, via })),
    undefinedUsed: [...undefinedUsed.values()].sort((a, b) => a.name.localeCompare(b.name)),
    toApply,
    conflicts,
    missing: missing.sort((a, b) => a.source.localeCompare(b.source) || a.token.localeCompare(b.token)),
    missingContexts,
    removed: removed.sort((a, b) => a.token.localeCompare(b.token)),
    deprecated: deprecated.sort((a, b) => a.token.localeCompare(b.token)),
    unused: unused.sort((a, b) => a.token.localeCompare(b.token)),
    customised,
    upToDate,
  };
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

const code = (s) => (s === undefined || s === "" ? "" : `\`${String(s).replace(/\|/g, "\\|").replace(/`/g, "'")}\``);
const loc = (file, line) => `${rel(file)}:${line}`;
const table = (headers, rows) =>
  rows.length
    ? [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n")
    : "_None._";

function renderMarkdown(r) {
  const out = [];
  const section = (title, intro, body) => out.push(`\n## ${title}\n`, intro ? `${intro}\n` : "", body);
  const { inputs } = r;
  const hasBase = Boolean(inputs.base);
  const ver = (s) => (s.version && !s.source.includes(s.version) ? `${s.version} (${s.source})` : s.source);

  out.push("# Salt theme audit\n");
  out.push(
    table(
      ["Input", "Details"],
      [
        ["Custom theme", `${inputs.theme.files} CSS files, ${inputs.theme.tokens} \`${inputs.prefix}\` tokens${inputs.theme.rootClasses.length ? `, root classes ${inputs.theme.rootClasses.map(code).join(", ")}` : ""}`],
        ["Salt latest", `${ver(inputs.salt)}, ${inputs.salt.tokens} tokens`],
        ["Salt base", hasBase ? `${ver(inputs.base)}, ${inputs.base.tokens} tokens` : "not given (use --base for a three-way comparison)"],
        ["Mode / variant", `${inputs.mode} / ${inputs.variant}`],
        ["Salt components", `${inputs.components.files} CSS files, ${inputs.components.usages} token usages`],
        ["Application source", inputs.app.files ? `${inputs.app.files} files, ${inputs.app.usages} token usages` : "not scanned (use --src); unused-token results are incomplete"],
      ],
    ),
  );

  const counts = [
    ["Broken references in theme", r.broken.length + r.indirectlyBroken.length],
    ["Undefined tokens used by components, app or theme", r.undefinedUsed.length],
    ...(hasBase
      ? [
          ["Upstream value changes to apply", r.toApply.length],
          ["Upstream changes conflicting with customisations", r.conflicts.length],
        ]
      : []),
    ...(inputs.mode === "clone"
      ? [
          ["Salt tokens missing from theme", `${r.missing.length} (${r.missing.filter((m) => m.used).length} used, ${r.missing.filter((m) => m.deprecated).length} deprecated)`],
          ["Token contexts missing (mode, density ...)", r.missingContexts.length],
        ]
      : []),
    ["Theme tokens unknown to Salt latest", r.removed.length],
    ["Deprecated Salt tokens still in use", r.deprecated.length],
    ["Unused theme tokens", `${r.unused.length} (${r.unused.filter((u) => !u.inSalt).length} not in Salt)`],
    ["Values customised (differ from Salt latest)", r.customised.length],
    ["Values identical to Salt latest", r.upToDate],
  ];
  section("Summary", "", table(["Check", "Count"], counts.map(([a, b]) => [a, String(b)])));

  section(
    "1. Broken references",
    "Theme tokens referencing a variable that is not defined (and has no fallback). These resolve to nothing and should be fixed first. Where Salt defines the missing variable, reinstate it from Salt.",
    table(
      ["Token", "Context", "Undefined reference", "Defined by Salt?", "Suggestion", "Location"],
      r.broken.map((b) => [code(b.token), code(b.context), code(b.ref), b.inSalt ? "yes, add it" : "no", b.suggestions.map(code).join(", "), loc(b.file, b.line)]),
    ) +
      (r.indirectlyBroken.length
        ? `\n\nAlso broken, because they resolve through a broken token:\n\n${table(["Token", "Via"], r.indirectlyBroken.map((b) => [code(b.token), code(b.via)]))}`
        : ""),
  );

  section(
    "2. Undefined tokens in use",
    `\`${inputs.prefix}\` variables referenced by Salt components (salt), application source (app) or non-token theme rules (theme) that the ${inputs.mode === "overlay" ? "custom and Salt themes don't" : "custom theme doesn't"} define.`,
    table(
      ["Token", "Defined by Salt?", "Suggestion", "Used in"],
      r.undefinedUsed.map((u) => {
        const shown = u.locations.slice(0, 4).map((l) => `${l.origin}: ${loc(l.file, l.line)}${l.fallback ? " (fallback)" : ""}`);
        if (u.locations.length > 4) shown.push(`+${u.locations.length - 4} more`);
        return [
          code(u.name) + (u.dynamic ? " (dynamic prefix)" : ""),
          u.dynamic ? "" : u.inSalt ? (u.deprecatedInSalt ? "yes (deprecated)" : "yes, add it") : "no",
          u.suggestions.map(code).join(", "),
          shown.join("<br>"),
        ];
      }),
    ),
  );

  if (hasBase) {
    section(
      "3. Upstream changes to apply",
      `Salt changed these values between ${inputs.base.version ?? "base"} and ${inputs.salt.version ?? "latest"}, and the custom theme still has the old Salt value. They can be updated to the new value.`,
      table(["Token", "Context", "Current (= old Salt)", "New Salt", "Location"], r.toApply.map((c) => [code(c.token), code(c.context), code(c.custom), code(c.salt), loc(c.file, c.line)])),
    );
    section(
      "4. Upstream changes conflicting with customisations",
      "Salt changed these values, and the custom theme has its own value. Review whether the upstream change should be reflected.",
      table(["Token", "Context", "Custom", "Old Salt", "New Salt", "Location"], r.conflicts.map((c) => [code(c.token), code(c.context), code(c.custom), code(c.base), code(c.salt), loc(c.file, c.line)])),
    );
  }

  if (inputs.mode === "clone") {
    const groups = new Map();
    for (const m of r.missing) groups.set(m.source, [...(groups.get(m.source) ?? []), m]);
    const body = [...groups]
      .map(([source, items]) => {
        const rows = items.map((m) => [
          code(m.token),
          [m.used ? "**used**" : "", m.deprecated ? "deprecated" : "", m.newInSalt === true ? "new" : m.newInSalt === false ? "dropped from theme" : ""].filter(Boolean).join(", "),
          m.values.map((v) => `${code(v.context)}: ${code(v.value)}`).join("<br>"),
        ]);
        return `### ${source}\n\n${table(["Token", "Notes", "Salt value"], rows)}`;
      })
      .join("\n\n");
    section(
      "5. Salt tokens missing from the theme",
      `Grouped by Salt source file. **used** tokens are referenced by components, application or theme and matter most. ${hasBase ? "*new* tokens were added to Salt after the base version; *dropped from theme* tokens existed in the base version but were removed from the custom theme." : ""}`,
      body || "_None._",
    );
    section(
      "6. Missing contexts",
      "Tokens the theme defines, but not for every context (mode, density, accent ...) that Salt defines them for. Without a definition the token is undefined in that context.",
      table(["Token", "Missing context", "Salt value", "Theme defines it for"], r.missingContexts.map((m) => [code(m.token), code(m.context), code(m.saltValue), m.definedIn.map(code).join(", ")])),
    );
  }

  section(
    "7. Theme tokens unknown to Salt latest",
    hasBase
      ? "*removed upstream* tokens existed in the base Salt theme but no longer exist; they may have been renamed (see suggestions). Others are custom additions."
      : "Either removed or renamed by Salt, or custom additions. Use --base to tell these apart.",
    table(
      ["Token", "Status", "Used?", "Suggested replacement", "Location"],
      r.removed.map((t) => [
        code(t.token),
        t.removedUpstream === true ? "removed upstream" : t.removedUpstream === false ? "custom" : "unknown (use --base)",
        t.used ? "yes" : "no",
        t.suggestions.map(code).join(", "),
        loc(t.file, t.line),
      ]),
    ),
  );

  section(
    "8. Deprecated Salt tokens in use",
    "Tokens that the latest Salt theme only defines in its deprecated files. Migrate usages to the replacement.",
    table(["Token", "Replacement", "Theme refs", "App refs", "Salt component refs"], r.deprecated.map((d) => [code(d.token), d.replacement.map(code).join(", "), String(d.themeUses), String(d.appUses), String(d.saltUses)])),
  );

  const unusedRows = (items) => items.map((u) => [code(u.token), u.inSalt ? (u.deprecatedInSalt ? "yes (deprecated)" : "yes") : "no"]);
  section(
    "9. Unused theme tokens",
    "Not referenced by Salt components, the application or the theme (directly or through other tokens). Tokens Salt doesn't define are the strongest candidates for removal; Salt-defined ones may be part of the public API used by other consumers." +
      (inputs.app.files ? "" : "\n\n**Application source was not scanned, so tokens only used by the application are listed here.**"),
    `${table(["Token", "Defined by Salt?"], unusedRows(r.unused.filter((u) => !u.inSalt)))}\n\n<details><summary>${r.unused.filter((u) => u.inSalt).length} unused tokens also defined by Salt</summary>\n\n${table(["Token", "Defined by Salt?"], unusedRows(r.unused.filter((u) => u.inSalt)))}\n\n</details>`,
  );

  section(
    hasBase ? "10. Other customised values" : "10. Customised values",
    hasBase
      ? "Values that differ from Salt where Salt itself didn't change: the theme's intentional customisations."
      : "Values that differ from Salt latest. Without --base these can't be split into customisations and outdated values.",
    `<details><summary>${r.customised.length} values</summary>\n\n${table(["Token", "Context", "Custom", "Salt", "Location"], r.customised.map((c) => [code(c.token), code(c.context), code(c.custom), code(c.salt), loc(c.file, c.line)]))}\n\n</details>`,
  );

  return `${out.filter((s) => s !== "").join("\n")}\n`;
}

// ---------------------------------------------------------------------------

const result = analyse();
const output =
  args.format === "json"
    ? JSON.stringify(result, (key, value) => (key === "file" ? rel(value) : value), 2)
    : renderMarkdown(result);
if (args.out) {
  fs.writeFileSync(args.out, output);
  console.error(`salt-theme-audit: report written to ${args.out}`);
} else {
  process.stdout.write(output);
}
if (args.strict && (result.broken.length || result.undefinedUsed.length)) process.exit(1);
