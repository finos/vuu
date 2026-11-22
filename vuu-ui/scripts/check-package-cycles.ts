/**
 * Fails if the @vuu-ui packages have a runtime import cycle, or a deep
 * import into another package's internals, that is not in the allow-list.
 *
 *   node ./scripts/check-package-cycles.ts            check (CI)
 *   node ./scripts/check-package-cycles.ts --report   also list every cross-package
 *                                                     edge inside each cycle, including
 *                                                     type-only and test imports
 *
 * Runtime edges are found by running each source file through Babel's
 * TypeScript transform, which drops imports that are only used as types, the
 * same way the build does. Test files are excluded from the gate.
 *
 * The allow-list (scripts/package-cycles-allowlist.json) names the edges that
 * are known to close today's cycles. With those edges removed the graph must be
 * acyclic. An allow-listed edge the graph no longer needs (it is gone, or the
 * graph stays acyclic without it) is reported as stale and must be removed, so
 * the list only shrinks.
 */
import babel from "@babel/core";
import fs from "node:fs";
import path from "node:path";

interface ImportRef {
  file: string;
  line: number;
  runtime: boolean;
  isTest: boolean;
  specifier: string;
}

type Edges = Map<string, Map<string, ImportRef[]>>;

interface AllowList {
  runtimeEdges: string[];
  deepImports: string[];
}

const SCOPE = "@vuu-ui/";
const vuuUiRoot = path.resolve(import.meta.dirname, "..");
const packagesRoot = path.join(vuuUiRoot, "packages");
const allowListPath = path.join(
  import.meta.dirname,
  "package-cycles-allowlist.json",
);
const report = process.argv.includes("--report");

const shortName = (name: string) => name.replace(SCOPE, "");
const edgeKey = (from: string, to: string) =>
  `${shortName(from)} -> ${shortName(to)}`;

const importPattern =
  /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)["'](@vuu-ui\/[^"'/]+)((?:\/[^"']*)?)["']/g;

const isTestFile = (relPath: string) =>
  /(^|\/)(test|tests|__tests__|playwright)\//.test(relPath) ||
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(relPath);

const sourceFiles = (dir: string, out: string[] = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(fullPath, out);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) out.push(fullPath);
  }
  return out;
};

const runtimeImports = (source: string, filePath: string) => {
  let code = source;
  if (filePath.endsWith(".d.ts")) {
    code = "";
  } else if (/\.[cm]?tsx?$/.test(filePath)) {
    code =
      babel.transformSync(source, {
        filename: filePath,
        babelrc: false,
        configFile: false,
        plugins: [
          [
            "@babel/plugin-transform-typescript",
            { isTSX: filePath.endsWith("x") },
          ],
        ],
      })?.code ?? "";
  } else if (/\.[cm]?jsx?$/.test(filePath)) {
    code = source;
  }
  const found = new Set<string>();
  for (const match of code.matchAll(importPattern)) found.add(match[1]);
  return found;
};

const readPackages = () => {
  const packages = new Map<string, string>();
  for (const dir of fs.readdirSync(packagesRoot)) {
    const packageJson = path.join(packagesRoot, dir, "package.json");
    if (fs.existsSync(packageJson)) {
      const { name } = JSON.parse(fs.readFileSync(packageJson, "utf8"));
      packages.set(name, path.join(packagesRoot, dir));
    }
  }
  return packages;
};

const collectEdges = (packages: Map<string, string>): Edges => {
  const edges: Edges = new Map();
  for (const [name, dir] of packages) {
    const targets = new Map<string, ImportRef[]>();
    edges.set(name, targets);
    for (const filePath of sourceFiles(dir)) {
      const source = fs.readFileSync(filePath, "utf8");
      if (!source.includes(SCOPE)) continue;
      const relPath = path.relative(dir, filePath);
      const runtime = runtimeImports(source, filePath);
      for (const match of source.matchAll(importPattern)) {
        const target = match[1];
        if (target === name || !packages.has(target)) continue;
        const refs = targets.get(target) ?? [];
        refs.push({
          file: relPath,
          line: source.slice(0, match.index).split("\n").length,
          runtime: runtime.has(target),
          isTest: isTestFile(relPath),
          specifier: target + match[2],
        });
        targets.set(target, refs);
      }
    }
  }
  return edges;
};

const buildGraph = (
  edges: Edges,
  include: (ref: ImportRef) => boolean,
  excluded = new Set<string>(),
) => {
  const graph = new Map<string, string[]>();
  for (const [from, targets] of edges) {
    graph.set(
      from,
      [...targets]
        .filter(
          ([to, refs]) => refs.some(include) && !excluded.has(edgeKey(from, to)),
        )
        .map(([to]) => to),
    );
  }
  return graph;
};

/** Tarjan's algorithm: strongly connected components with more than one member. */
const findCycles = (graph: Map<string, string[]>) => {
  let counter = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const visit = (node: string) => {
    index.set(node, counter);
    low.set(node, counter);
    counter += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!index.has(next)) {
        visit(next);
        low.set(node, Math.min(low.get(node)!, low.get(next)!));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node)!, index.get(next)!));
      }
    }
    if (low.get(node) === index.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      if (component.length > 1) components.push(component.sort());
    }
  };

  for (const node of graph.keys()) if (!index.has(node)) visit(node);
  return components;
};

const describeRef = (ref: ImportRef) =>
  `${ref.file}:${ref.line}${ref.runtime ? "" : " (type)"}${ref.isTest ? " (test)" : ""}`;

const MAX_REFS_SHOWN = 3;

const printRefs = (refs: ImportRef[], indent: string) => {
  for (const ref of refs.slice(0, MAX_REFS_SHOWN))
    console.log(`${indent}${describeRef(ref)}`);
  if (refs.length > MAX_REFS_SHOWN)
    console.log(`${indent}... and ${refs.length - MAX_REFS_SHOWN} more`);
};

/** Shortest path from `to` back to `from` inside one component, as a closed loop. */
const shortestLoop = (
  from: string,
  to: string,
  graph: Map<string, string[]>,
  members: Set<string>,
) => {
  const previous = new Map<string, string>([[to, to]]);
  const queue = [to];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === from) break;
    for (const next of graph.get(node) ?? []) {
      if (members.has(next) && !previous.has(next)) {
        previous.set(next, node);
        queue.push(next);
      }
    }
  }
  // Walk back from `from` to `to`, then prepend the closing edge from -> to.
  const back: string[] = [];
  for (let node = from; node !== to; node = previous.get(node)!)
    back.push(node);
  back.push(to);
  return [from, ...back.reverse()];
};

const printComponent = (
  component: string[],
  graph: Map<string, string[]>,
  edges: Edges,
  include: (ref: ImportRef) => boolean,
) => {
  const members = new Set(component);
  console.log(`  Packages in the cycle: ${component.map(shortName).join(", ")}`);
  // Show one concrete loop, starting from the first edge inside the component.
  const start = component[0];
  const next = (graph.get(start) ?? []).find((node) => members.has(node))!;
  const loop = shortestLoop(start, next, graph, members);
  console.log(`  Example loop: ${loop.map(shortName).join(" -> ")}`);
  for (let i = 0; i < loop.length - 1; i++) {
    const refs = edges.get(loop[i])!.get(loop[i + 1])!.filter(include);
    console.log(`    ${edgeKey(loop[i], loop[i + 1])} (${refs.length} imports)`);
    printRefs(refs, "      ");
  }
};

const main = () => {
  const allowList: AllowList = JSON.parse(fs.readFileSync(allowListPath, "utf8"));
  const allowedEdges = new Set(allowList.runtimeEdges);
  const allowedDeepImports = new Set(allowList.deepImports);
  const edges = collectEdges(readPackages());
  const gated = (ref: ImportRef) => ref.runtime && !ref.isTest;
  const problems: string[] = [];

  // Cycles that remain once the allow-listed edges are removed.
  const residual = buildGraph(edges, gated, allowedEdges);
  const newCycles = findCycles(residual);
  if (newCycles.length > 0) {
    problems.push("runtime import cycle(s) not covered by the allow-list");
    console.log("\nRuntime import cycles not covered by the allow-list:");
    for (const component of newCycles)
      printComponent(component, residual, edges, gated);
  }

  // Allow-listed edges the graph no longer needs: put each one back in turn,
  // and keep it out of the allow-list if the graph stays acyclic. Doing this
  // one edge at a time means removing every reported edge is safe together.
  const staleEdges: string[] = [];
  if (newCycles.length === 0) {
    const stillNeeded = new Set(allowedEdges);
    for (const key of allowedEdges) {
      stillNeeded.delete(key);
      if (findCycles(buildGraph(edges, gated, stillNeeded)).length > 0) {
        stillNeeded.add(key);
      } else {
        staleEdges.push(key);
      }
    }
  }
  if (staleEdges.length > 0) {
    problems.push("stale allow-list edge(s)");
    console.log(
      "\nAllow-listed edges that are no longer needed to break a cycle (remove them from the allow-list):",
    );
    for (const key of staleEdges) console.log(`  ${key}`);
  }

  // Deep imports into another package's internals.
  const deepImports = new Map<string, ImportRef[]>();
  for (const [from, targets] of edges)
    for (const refs of targets.values())
      for (const ref of refs)
        if (!ref.isTest && ref.specifier.includes("/", SCOPE.length)) {
          const key = `${shortName(from)} -> ${ref.specifier}`;
          deepImports.set(key, [...(deepImports.get(key) ?? []), ref]);
        }
  const newDeepImports = [...deepImports].filter(
    ([key]) => !allowedDeepImports.has(key),
  );
  if (newDeepImports.length > 0) {
    problems.push("deep import(s) into package internals");
    console.log(
      "\nDeep imports into another package's internals (import from the package entry point instead):",
    );
    for (const [key, refs] of newDeepImports) {
      console.log(`  ${key}`);
      printRefs(refs, "    ");
    }
  }
  const staleDeepImports = [...allowedDeepImports].filter(
    (key) => !deepImports.has(key),
  );
  if (staleDeepImports.length > 0) {
    problems.push("stale allow-list deep import(s)");
    console.log(
      "\nAllow-listed deep imports that no longer exist (remove them from the allow-list):",
    );
    for (const key of staleDeepImports) console.log(`  ${key}`);
  }

  if (report) {
    const everything = () => true;
    const all = buildGraph(edges, everything);
    console.log("\nCycles counting every import (runtime, type-only and tests):");
    for (const component of findCycles(all))
      printComponent(component, all, edges, everything);
  }

  if (problems.length > 0) {
    console.error(
      `\ncheck-package-cycles failed: ${problems.join("; ")}.\nAllow-list: ${path.relative(vuuUiRoot, allowListPath)}`,
    );
    process.exit(1);
  }
  console.log(
    `check-package-cycles: OK (${allowedEdges.size} allow-listed cycle edges, ${allowedDeepImports.size} allow-listed deep imports)`,
  );
};

main();
