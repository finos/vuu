import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { findTreeNode } from "../../shared-utils";
import {
  countExamples,
  DOCS_ID,
  getExampleNodes,
  type NavNodeData,
  THEME_PATH,
} from "../tree-nav/nav-tree";

type NavNode = TreeSourceNode<NavNodeData>;

export interface PageRef {
  label: string;
  path: string;
  /** labels of ancestors, outermost first */
  trail: string[];
  live?: boolean;
}

export interface AreaSummary {
  count: number;
  id: string;
  label: string;
  liveCount: number;
  path: string;
  samples: PageRef[];
}

export interface HomeStats {
  docChapters: number;
  docGuides: number;
  examples: number;
  liveExamples: number;
}

export type StartHereEntry =
  | { kind: "guide"; path: string }
  | { kind: "theme" }
  | { kind: "page"; path: string; description: string };

export type StartHereArt = "guide" | "theme" | "page";

export interface StartHereCard {
  art: StartHereArt;
  description: string;
  path: string;
  title: string;
}

export interface ThemeSummaryLike {
  name: string;
  tokenCount: number;
}

const SAMPLE_COUNT = 3;

const isExample = (node: NavNode) =>
  !node.childNodes?.length && typeof node.nodeData?.componentName === "string";

const visitLeaves = (
  nodes: NavNode[],
  visit: (node: NavNode) => void,
): void => {
  for (const node of nodes) {
    if (node.childNodes?.length) {
      visitLeaves(node.childNodes, visit);
    } else {
      visit(node);
    }
  }
};

const countLiveExamples = (nodes: NavNode[]) => {
  let count = 0;
  visitLeaves(nodes, (node) => {
    if (isExample(node) && node.nodeData?.live) {
      count += 1;
    }
  });
  return count;
};

/**
 * Maps every route in the tree to its label and ancestor labels, used to
 * present recently viewed pages.
 */
export const createPageIndex = (treeSource: NavNode[]) => {
  const index = new Map<string, PageRef>();
  const visit = (nodes: NavNode[], trail: string[]) => {
    for (const node of nodes) {
      const path = `/${node.id}`;
      index.set(path, {
        label: node.label,
        live: node.nodeData?.live,
        path,
        trail,
      });
      if (node.childNodes) {
        visit(node.childNodes, trail.concat(node.label));
      }
    }
  };
  visit(treeSource, []);
  return index;
};

const getDocGuides = (treeSource: NavNode[]) =>
  (treeSource.find(({ id }) => id === DOCS_ID)?.childNodes ?? []).filter(
    (node) => node.childNodes?.length,
  );

export const getHomeStats = (treeSource: NavNode[]): HomeStats => {
  const exampleNodes = getExampleNodes(treeSource);
  const guides = getDocGuides(treeSource);
  return {
    docChapters: guides.reduce(
      (count, guide) => count + (guide.childNodes?.length ?? 0),
      0,
    ),
    docGuides: guides.length,
    examples: countExamples(exampleNodes),
    liveExamples: countLiveExamples(exampleNodes),
  };
};

/**
 * One summary per top level component folder, largest first. Samples are the
 * first examples found, depth first.
 */
export const getAreas = (treeSource: NavNode[]): AreaSummary[] =>
  getExampleNodes(treeSource)
    .filter((node) => node.childNodes?.length)
    .map((node) => {
      const samples: PageRef[] = [];
      const childNodes = node.childNodes ?? [];
      visitLeaves(childNodes, (leaf) => {
        if (samples.length < SAMPLE_COUNT && isExample(leaf)) {
          samples.push({
            label: leaf.label,
            live: leaf.nodeData?.live,
            path: `/${leaf.id}`,
            trail: [],
          });
        }
      });
      return {
        count: node.nodeData?.count ?? 0,
        id: node.id,
        label: node.label,
        liveCount: countLiveExamples(childNodes),
        path: `/${node.id}`,
        samples,
      };
    })
    .sort((a1, a2) => a2.count - a1.count || a1.label.localeCompare(a2.label));

/**
 * Resolves the curated Start here entries against the tree. Entries whose
 * route no longer exists are dropped, rather than presenting a broken link.
 */
export const getStartHereCards = (
  entries: StartHereEntry[],
  treeSource: NavNode[],
  themeSummary?: ThemeSummaryLike,
): StartHereCard[] => {
  const cards: StartHereCard[] = [];
  for (const entry of entries) {
    if (entry.kind === "theme") {
      cards.push({
        art: "theme",
        description: themeSummary
          ? `${themeSummary.name} · ${themeSummary.tokenCount} tokens in 3 tiers`
          : "Foundations, palette and characteristics",
        path: THEME_PATH,
        title: "Theme Browser",
      });
      continue;
    }
    const node = findTreeNode(entry.path, treeSource);
    if (node === undefined) {
      continue;
    }
    if (entry.kind === "guide") {
      const chapters = node.childNodes ?? [];
      const first = chapters.at(0)?.label;
      const last = chapters.at(-1)?.label;
      cards.push({
        art: "guide",
        description:
          first && last && chapters.length > 1
            ? `${chapters.length} chapters · ${first} → ${last}`
            : `${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`,
        path: entry.path,
        title: `${node.label} guide`,
      });
    } else {
      cards.push({
        art: "page",
        description: entry.description,
        path: entry.path,
        title: node.label,
      });
    }
  }
  return cards;
};

/** Recently viewed paths resolved to pages, unknown paths are dropped */
export const resolveRecent = (
  recent: string[],
  pageIndex: Map<string, PageRef>,
) =>
  recent
    .map((path) => pageIndex.get(path))
    .filter((page): page is PageRef => page !== undefined);
