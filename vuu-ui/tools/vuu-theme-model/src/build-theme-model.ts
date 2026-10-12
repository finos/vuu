import path from "node:path";
import { type CssNode, generate, parse } from "css-tree";
import { analyseValue } from "./analyse-value.ts";
import { assignCategories } from "./assign-categories.ts";
import {
  classifyThemeFile,
  type FileClassification,
} from "./classify-theme-file.ts";
import {
  loadThemeSources,
  type ThemeSourceFile,
} from "./load-theme-sources.ts";
import { parseScope } from "./parse-scope.ts";
import {
  THEME_MODEL_SCHEMA_VERSION,
  THEME_TIERS,
  type ThemeAxis,
  type ThemeDiagnostic,
  type ThemeGroup,
  type ThemeModel,
  type ThemeScope,
  type ThemeTier,
  type ThemeToken,
} from "./theme-model-types.ts";

const RECURSIVE_AT_RULES = new Set(["media", "supports", "layer", "container"]);

export interface BuildThemeModelOptions {
  /** theme entry file, e.g. .../css/theme-next.css */
  entry: string;
  /**
   * additional theme files (e.g. legacy theme.css) consulted only to resolve
   * tokens referenced, but not declared, by the theme
   */
  fallback?: string[];
  /** display name for the theme, defaults to entry file name */
  name?: string;
}

const tokenPrefix = (name: string) => {
  const [prefix = "", ...segments] = name.replace(/^--/, "").split("-");
  return { prefix, segments };
};

export const buildThemeModelFromSources = (
  sources: ThemeSourceFile[],
  {
    name,
    entry,
    fallbackSources = [],
  }: { name: string; entry: string; fallbackSources?: ThemeSourceFile[] },
): ThemeModel => {
  const tokens = new Map<string, ThemeToken>();
  const scopes = new Map<string, ThemeScope>();
  const axisSources = new Map<string, string>();
  const axisValues = new Map<string, Set<string>>();
  const groups = new Map<string, ThemeGroup>();
  const diagnostics: ThemeDiagnostic[] = [];

  const collectDeclarations = (
    source: ThemeSourceFile,
    classification: FileClassification,
    accept: (tokenName: string) => boolean = () => true,
  ) => {
    const { tier, layer, group: groupName } = classification;

    const groupKey = `${tier}:${source.path}`;
    let group = groups.get(groupKey);
    if (!group) {
      group = {
        name: groupName,
        tier,
        layer,
        file: source.path,
        tokens: [],
      };
      groups.set(groupKey, group);
    }

    let ast: CssNode;
    try {
      ast = parse(source.css, {
        positions: true,
        filename: source.path,
        parseValue: false,
        parseCustomProperty: false,
      });
    } catch (err) {
      diagnostics.push({
        type: "parse-error",
        message: String(err),
        location: { file: source.path, line: 1, column: 1 },
      });
      return;
    }

    const location = (node: CssNode) => ({
      file: source.path,
      line: (node.loc?.start.line ?? 1) + source.lineOffset,
      column: node.loc?.start.column ?? 1,
    });

    const visitRule = (rule: CssNode, atRules: string[]) => {
      if (rule.type !== "Rule" || rule.prelude.type !== "SelectorList") return;

      const ruleScopes = rule.prelude.children.toArray().map((selector) => {
        const scope = parseScope(generate(selector), atRules, axisSources);
        if (!scopes.has(scope.id)) {
          scopes.set(scope.id, scope);
          if (scope.complex) {
            diagnostics.push({
              type: "complex-selector",
              message: `selector '${scope.selector}' cannot be mapped to theme axes`,
              location: location(selector),
            });
          }
        }
        for (const [axis, value] of Object.entries(scope.conditions)) {
          let values = axisValues.get(axis);
          if (!values) axisValues.set(axis, (values = new Set()));
          values.add(value);
        }
        return scopes.get(scope.id) as ThemeScope;
      });

      rule.block.children.forEach((declaration) => {
        if (
          declaration.type !== "Declaration" ||
          !declaration.property.startsWith("--") ||
          !accept(declaration.property)
        ) {
          return;
        }
        const tokenName = declaration.property;
        const raw =
          declaration.value.type === "Raw"
            ? declaration.value.value.trim()
            : generate(declaration.value);
        const { kind, references } = analyseValue(raw);

        let token = tokens.get(tokenName);
        if (!token) {
          token = {
            name: tokenName,
            ...tokenPrefix(tokenName),
            tier,
            layer,
            group: groupName,
            category: "other",
            values: [],
            references: [],
            referencedBy: [],
          };
          tokens.set(tokenName, token);
          group.tokens.push(tokenName);
        } else if (
          token.group !== groupName ||
          token.tier !== tier ||
          token.layer !== layer
        ) {
          const firstFile = token.values[0]?.location.file;
          if (firstFile && firstFile !== source.path) {
            diagnostics.push({
              type: "declared-in-multiple-files",
              message: `${tokenName} first declared in ${firstFile}, redeclared in ${source.path}`,
              token: tokenName,
              location: location(declaration),
            });
          }
        }

        for (const scope of ruleScopes) {
          const value = {
            scopeId: scope.id,
            raw,
            kind,
            references,
            location: location(declaration),
          };
          const existing = token.values.findIndex(
            (v) => v.scopeId === scope.id,
          );
          if (existing === -1) {
            token.values.push(value);
          } else {
            // later declarations win, as per the cascade
            if (token.values[existing].raw !== raw) {
              diagnostics.push({
                type: "overridden-in-scope",
                message: `${tokenName} in scope ${scope.id} overridden: '${token.values[existing].raw}' => '${raw}'`,
                token: tokenName,
                location: value.location,
              });
            }
            token.values[existing] = value;
          }
        }
      });
    };

    const visitBlock = (nodes: CssNode[], atRules: string[]) => {
      for (const node of nodes) {
        if (node.type === "Rule") {
          visitRule(node, atRules);
        } else if (
          node.type === "Atrule" &&
          RECURSIVE_AT_RULES.has(node.name) &&
          node.block
        ) {
          const prelude = node.prelude ? generate(node.prelude) : "";
          visitBlock(node.block.children.toArray(), [
            ...atRules,
            `${node.name} ${prelude}`.trim(),
          ]);
        }
        // other at-rules (keyframes, font-face, import) declare no tokens
      }
    };

    if (ast.type === "StyleSheet") {
      visitBlock(ast.children.toArray(), []);
    }
  };

  for (const source of sources) {
    const classification = classifyThemeFile(source.path);
    if (classification) {
      collectDeclarations(source, classification);
    }
  }

  // Pull in declarations from fallback sources (e.g legacy theme.css) only
  // for tokens that are referenced, but not declared, by the theme proper.
  const unresolvedReferences = () => {
    const unresolved = new Set<string>();
    for (const token of tokens.values()) {
      for (const value of token.values) {
        for (const ref of value.references) {
          if (!tokens.has(ref)) unresolved.add(ref);
        }
      }
    }
    return unresolved;
  };

  if (fallbackSources.length > 0) {
    let wanted = unresolvedReferences();
    while (wanted.size > 0) {
      const sizeBefore = tokens.size;
      for (const source of fallbackSources) {
        const classification = classifyThemeFile(source.path, {
          allowLegacy: true,
        });
        if (classification) {
          collectDeclarations(
            source,
            { ...classification, layer: "legacy" },
            (tokenName) => wanted.has(tokenName),
          );
        }
      }
      if (tokens.size === sizeBefore) break;
      wanted = unresolvedReferences();
    }
  }

  // references
  for (const token of tokens.values()) {
    const references = new Set<string>();
    for (const value of token.values) {
      for (const ref of value.references) {
        if (references.has(ref)) continue;
        references.add(ref);
        const target = tokens.get(ref);
        if (target) {
          if (!target.referencedBy.includes(token.name)) {
            target.referencedBy.push(token.name);
          }
        } else {
          diagnostics.push({
            type: "unresolved-reference",
            message: `${token.name} references ${ref}, which is not declared in the theme`,
            token: token.name,
            location: value.location,
          });
        }
      }
    }
    token.references = [...references];
  }

  assignCategories(tokens);

  const axes: ThemeAxis[] = [...axisValues.entries()].map(
    ([axisName, values]) => ({
      name: axisName,
      source: axisSources.get(axisName) ?? axisName,
      values: [...values],
    }),
  );

  const groupsByTier = Object.fromEntries(
    THEME_TIERS.map((tier) => [tier, [] as ThemeGroup[]]),
  ) as Record<ThemeTier, ThemeGroup[]>;
  for (const group of groups.values()) {
    if (group.tokens.length > 0) {
      groupsByTier[group.tier].push(group);
    }
  }

  return {
    schemaVersion: THEME_MODEL_SCHEMA_VERSION,
    name,
    entry,
    axes,
    scopes: [...scopes.values()],
    groups: groupsByTier,
    tokens: Object.fromEntries(tokens),
    diagnostics,
  };
};

export const buildThemeModel = ({
  entry,
  fallback = [],
  name,
}: BuildThemeModelOptions): ThemeModel => {
  const sources = loadThemeSources(entry);
  const fallbackSources = fallback.flatMap((file) => loadThemeSources(file));
  return buildThemeModelFromSources(sources, {
    name: name ?? path.basename(entry, ".css"),
    entry: path.basename(entry),
    fallbackSources,
  });
};
