import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { TokenSearchEntry } from "@vuu-ui/vuu-theme-model/src/token-search-index";
import type { ChromeIconName } from "../chrome/ChromeIcon";
import { DOCS_ID, type NavNodeData, THEME_PATH } from "../tree-nav/nav-tree";
import type { DocSearchEntry } from "./docs-index";
import { SearchIndex, type SearchField, toTerms } from "./search-engine";

type NavNode = TreeSourceNode<NavNodeData>;

export type PaletteScope = "examples" | "docs" | "tokens" | "commands";

export const SCOPES: { label: string; scope: PaletteScope }[] = [
  { label: "Examples", scope: "examples" },
  { label: "Docs", scope: "docs" },
  { label: "Tokens", scope: "tokens" },
  { label: "Commands", scope: "commands" },
];

export const GROUP_LABELS: Record<PaletteScope | "recent", string> = {
  commands: "Commands",
  docs: "Docs",
  examples: "Examples",
  recent: "Recent",
  tokens: "Theme tokens",
};

export interface PaletteItem {
  key: string;
  scope: PaletteScope;
  icon: ChromeIconName;
  /** title segments, presented as a breadcrumb */
  title: string[];
  subtitle?: string;
  badge?: { label: string; live?: boolean };
  /** css colours (light, dark) previewed for colour tokens */
  swatches?: string[];
  /** in-app route */
  path?: string;
  /** url opened by mod+enter, in a new tab */
  externalHref?: string;
  /** commands only */
  run?: () => void;
  fields: SearchField[];
  /** body text, an excerpt around the first match is used as subtitle */
  text?: string;
}

export const routeOf = (path: string, anchor?: string) =>
  anchor ? `${path}?anchor=${encodeURIComponent(anchor)}` : path;

export const tokenPath = (name: string) =>
  `${THEME_PATH}?token=${encodeURIComponent(name)}`;

/** Every example in the tree, with the labels of its ancestors */
export const exampleItems = (treeSource: NavNode[]): PaletteItem[] => {
  const items: PaletteItem[] = [];
  const visit = (nodes: NavNode[], trail: string[]) => {
    for (const node of nodes) {
      if (node.id === DOCS_ID) continue;
      const {
        componentName,
        description,
        live,
        tags = [],
      } = node.nodeData ?? {};
      if (node.childNodes?.length) {
        visit(node.childNodes as NavNode[], trail.concat(node.label));
      } else if (typeof componentName === "string") {
        items.push({
          badge: live
            ? { label: "Live", live: true }
            : tags[0]
              ? { label: tags[0] }
              : undefined,
          fields: [
            { text: node.label, weight: 10 },
            { text: componentName, weight: 8 },
            { text: tags.join(" "), weight: 4 },
            { text: trail.join(" "), weight: 3 },
            { text: description ?? "", weight: 2 },
          ],
          icon: "examples",
          key: `example:${node.id}`,
          path: `/${node.id}`,
          scope: "examples",
          subtitle: trail.join(" › "),
          title: [node.label],
        });
      }
    }
  };
  visit(treeSource, []);
  return items;
};

export const docItems = (entries: DocSearchEntry[]): PaletteItem[] =>
  entries.map(({ anchor, breadcrumb, route, text, title }) => ({
    fields: [
      { text: title[title.length - 1], weight: 9 },
      { text: title.slice(0, -1).join(" "), weight: 5 },
      { text: breadcrumb.join(" "), weight: 3 },
      { text, weight: 1 },
    ],
    icon: "docs",
    key: `doc:${route}#${anchor ?? ""}`,
    path: routeOf(route, anchor),
    scope: "docs",
    text,
    title,
  }));

const TIER_LABELS: Record<string, string> = {
  characteristics: "Characteristic",
  foundations: "Foundation",
  palette: "Palette",
};

export const tokenItems = (entries: TokenSearchEntry[]): PaletteItem[] =>
  entries.map(({ alias, category, dark, group, light, name, tier }) => ({
    fields: [
      { text: name, weight: 10 },
      { text: group, weight: 3 },
      { text: alias ?? "", weight: 2 },
    ],
    icon: "theme",
    key: `token:${name}`,
    path: tokenPath(name),
    scope: "tokens",
    subtitle: [TIER_LABELS[tier] ?? tier, group, alias ? `→ ${alias}` : ""]
      .filter(Boolean)
      .join(" · "),
    swatches:
      category === "color" && light
        ? dark && dark !== light
          ? [light, dark]
          : [light]
        : undefined,
    title: [name],
  }));

export interface PaletteCommand {
  id: string;
  icon: ChromeIconName;
  title: string;
  subtitle?: string;
  keywords?: string;
  run: () => void;
}

export const commandItems = (commands: PaletteCommand[]): PaletteItem[] =>
  commands.map(({ icon, id, keywords = "", run, subtitle, title }) => ({
    fields: [
      { text: title, weight: 10 },
      { text: keywords, weight: 4 },
      { text: subtitle ?? "", weight: 2 },
    ],
    icon,
    key: `command:${id}`,
    run,
    scope: "commands",
    subtitle,
    title: [title],
  }));

const EXCERPT_LENGTH = 110;
const EXCERPT_LEAD = 30;

/** An excerpt of text, around the first occurrence of a query term */
export const excerpt = (text: string, query: string) => {
  const lower = text.toLowerCase();
  const at = toTerms(query)
    .map((term) => lower.indexOf(term))
    .filter((i) => i !== -1)
    .reduce((min, i) => Math.min(min, i), Infinity);
  const start =
    at === Infinity || at < EXCERPT_LEAD
      ? 0
      : text.lastIndexOf(" ", at - EXCERPT_LEAD) + 1;
  const end = start + EXCERPT_LENGTH;
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${
    end < text.length ? "…" : ""
  }`;
};

export interface PaletteGroup {
  id: PaletteScope | "recent";
  items: PaletteItem[];
}

export interface PaletteResults {
  counts: Record<PaletteScope, number>;
  groups: PaletteGroup[];
}

export type PaletteIndexes = Record<PaletteScope, SearchIndex<PaletteItem>>;

export const createIndex = (items: PaletteItem[]) =>
  new SearchIndex(items, (item) => item.fields);

const ALL_SCOPE_LIMIT = 5;
const SINGLE_SCOPE_LIMIT = 50;

/**
 * Search results, grouped by scope. With no scope selected, each group is
 * limited and groups are ordered by their best match.
 */
export const searchPalette = (
  indexes: PaletteIndexes,
  query: string,
  scope?: PaletteScope,
): PaletteResults => {
  const scored = SCOPES.map(({ scope: id }) => ({
    id,
    results: indexes[id].search(query),
  }));
  const counts = Object.fromEntries(
    scored.map(({ id, results }) => [id, results.length]),
  ) as Record<PaletteScope, number>;
  const groups = scored
    .filter(({ id, results }) => results.length && (!scope || scope === id))
    .sort((a, b) => b.results[0].score - a.results[0].score)
    .map(({ id, results }) => ({
      id,
      items: results
        .slice(0, scope ? SINGLE_SCOPE_LIMIT : ALL_SCOPE_LIMIT)
        .map(({ item }) => item),
    }));
  return { counts, groups };
};
