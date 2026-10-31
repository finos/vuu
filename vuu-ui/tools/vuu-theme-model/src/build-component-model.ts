import fs from "node:fs";
import path from "node:path";
import postcss, { type ChildNode, type Container } from "postcss";
import {
  COMPONENT_MODEL_SCHEMA_VERSION,
  type ComponentDeclaration,
  type ComponentModel,
  type ComponentModelConfig,
  type ThemeComponent,
} from "./component-model-types.ts";

const VAR_REFERENCE = /var\(\s*(--[\w-]+)/g;

/** every custom property referenced by a css value, including var() fallbacks */
export const referencesIn = (value: string) => [
  ...new Set([...value.matchAll(VAR_REFERENCE)].map(([, name]) => name)),
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Matches a selector list where a selector's first compound includes .cls or
 * a modifier .cls-x (but not .clsOther). Rules in which another component
 * styles this one, e.g. `.saltInput-adornment .saltButton`, are excluded.
 */
const classMatcher = (classes?: string[]) => {
  if (!classes?.length) return () => true;
  // Every class name is escaped, so the pattern is a fixed alternation of literals
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
  const pattern = new RegExp(
    `\\.(?:${classes.map(escapeRegExp).join("|")})(?![\\w])`,
  );
  return (selectorList: string) =>
    selectorList
      .split(",")
      .some((selector) => pattern.test(selector.trim().split(/[\s>+~]/)[0]));
};

const resolveNesting = (parent: string | undefined, selector: string) => {
  if (!parent) return selector;
  return selector.includes("&")
    ? selector.replaceAll("&", parent)
    : `${parent} ${selector}`;
};

/** file paths for display: relative to root, without node_modules */
const displayPath = (root: string, file: string) =>
  path
    .relative(root, file)
    .split(path.sep)
    .join("/")
    .replace(/^(?:.*\/)?node_modules\//, "");

interface ExtractOptions {
  css: string;
  file: string;
  classes?: string[];
}

const normalise = (text: string) =>
  text
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Declarations that use var(), from the rules of a stylesheet that match the
 * given classes. Nested rules (css nesting) and at-rules are followed.
 */
export const extractComponentDeclarations = ({
  css,
  file,
  classes,
}: ExtractOptions): ComponentDeclaration[] => {
  const matches = classMatcher(classes);
  const declarations: ComponentDeclaration[] = [];

  const visit = (
    node: ChildNode,
    selector: string | undefined,
    included: boolean,
    atRules: string[],
  ) => {
    if (node.type === "rule") {
      const resolved = resolveNesting(selector, normalise(node.selector));
      visitChildren(node, resolved, included || matches(resolved), atRules);
    } else if (node.type === "atrule") {
      const name = normalise(`@${node.name} ${node.params}`);
      visitChildren(node, selector, included, [...atRules, name]);
    } else if (node.type === "decl" && included && selector) {
      const value = normalise(node.value);
      const references = referencesIn(value);
      if (references.length) {
        declarations.push({
          selector,
          ...(atRules.length ? { atRules } : {}),
          property: node.prop,
          value,
          references,
          location: {
            file,
            line: node.source?.start?.line ?? 1,
            column: node.source?.start?.column ?? 1,
          },
        });
      }
    }
  };
  const visitChildren = (
    container: Container,
    selector: string | undefined,
    included: boolean,
    atRules: string[],
  ) =>
    container.each((child) => {
      visit(child, selector, included, atRules);
    });

  visitChildren(postcss.parse(css, { from: file }), undefined, false, []);
  return declarations;
};

const toId = (...parts: string[]) =>
  parts
    .join("-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();

export interface BuildComponentModelOptions {
  config: ComponentModelConfig;
  /** directory of the config file, config paths are relative to it */
  configDir: string;
  readFile?: (file: string) => string;
}

export const buildComponentModel = ({
  config,
  configDir,
  readFile = (file) => fs.readFileSync(file, "utf8"),
}: BuildComponentModelOptions): ComponentModel => {
  const root = path.resolve(configDir, config.root ?? ".");
  const cache = new Map<string, string>();
  const read = (file: string) => {
    let css = cache.get(file);
    if (css === undefined) cache.set(file, (css = readFile(file)));
    return css;
  };

  return {
    schemaVersion: COMPONENT_MODEL_SCHEMA_VERSION,
    libraries: config.libraries.map((library) => ({
      id: library.id,
      label: library.label,
      components: library.components.map((component): ThemeComponent => {
        const sources = component.css ?? library.css ?? [];
        if (!sources.length) {
          throw Error(`component '${component.label}' has no css sources`);
        }
        const files = sources.map((source) => path.resolve(root, source));
        return {
          id: component.id ?? toId(library.id, component.label),
          label: component.label,
          library: library.id,
          sources: files.map((file) => displayPath(root, file)),
          declarations: files.flatMap((file) =>
            extractComponentDeclarations({
              css: read(file),
              file: displayPath(root, file),
              classes: component.classes,
            }),
          ),
        };
      }),
    })),
  };
};

/** every custom property referenced by a component */
export const componentReferences = (component: ThemeComponent) => [
  ...new Set(component.declarations.flatMap((d) => d.references)),
];
