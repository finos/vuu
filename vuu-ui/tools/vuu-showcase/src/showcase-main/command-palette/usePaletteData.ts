import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { TokenSearchEntry } from "@vuu-ui/vuu-theme-model/src/token-search-index";
import { useEffect, useMemo, useState } from "react";
import { createPageIndex, resolveRecent } from "../home/home-model";
import { useRecent } from "../tree-nav/nav-store";
import { DOCS_ID, type NavNodeData } from "../tree-nav/nav-tree";
import { DOCS_INDEX_URL, type DocSearchEntry } from "./docs-index";
import {
  commandItems,
  createIndex,
  docItems,
  exampleItems,
  type PaletteCommand,
  type PaletteIndexes,
  type PaletteItem,
  type PaletteScope,
  tokenItems,
} from "./palette-model";

type NavNode = TreeSourceNode<NavNodeData>;

const MAX_RECENT = 5;

// Both indexes are loaded once, on first use, and shared thereafter
let docsPromise: Promise<DocSearchEntry[]> | undefined;
let tokensPromise: Promise<TokenSearchEntry[]> | undefined;

const loadDocs = () =>
  (docsPromise ??= fetch(DOCS_INDEX_URL)
    .then((response) => (response.ok ? response.json() : []))
    .catch(() => []));

const loadTokens = () =>
  (tokensPromise ??=
    // Generated at build time by `npm run build:theme-model`, not committed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import("../../theme-browser/generated/vuu-theme.search.js")
      .then(({ tokens }: { tokens: TokenSearchEntry[] }) => tokens ?? [])
      .catch(() => []));

export interface PaletteData {
  indexes: PaletteIndexes;
  items: Record<PaletteScope, PaletteItem[]>;
  loading: boolean;
  recent: PaletteItem[];
}

export const usePaletteData = (
  treeSource: NavNode[],
  commands: PaletteCommand[],
): PaletteData => {
  const [docs, setDocs] = useState<PaletteItem[]>();
  const [tokens, setTokens] = useState<PaletteItem[]>();

  useEffect(() => {
    let mounted = true;
    loadDocs().then((entries) => mounted && setDocs(docItems(entries)));
    loadTokens().then((entries) => mounted && setTokens(tokenItems(entries)));
    return () => {
      mounted = false;
    };
  }, []);

  const examples = useMemo(() => exampleItems(treeSource), [treeSource]);
  const commandList = useMemo(() => commandItems(commands), [commands]);

  const items = useMemo(
    () => ({
      commands: commandList,
      docs: docs ?? [],
      examples,
      tokens: tokens ?? [],
    }),
    [commandList, docs, examples, tokens],
  );

  const examplesIndex = useMemo(() => createIndex(examples), [examples]);
  const docsIndex = useMemo(() => createIndex(items.docs), [items.docs]);
  const tokensIndex = useMemo(() => createIndex(items.tokens), [items.tokens]);
  const commandsIndex = useMemo(() => createIndex(commandList), [commandList]);
  const indexes = useMemo(
    () => ({
      commands: commandsIndex,
      docs: docsIndex,
      examples: examplesIndex,
      tokens: tokensIndex,
    }),
    [commandsIndex, docsIndex, examplesIndex, tokensIndex],
  );

  const recentPaths = useRecent();
  const pageIndex = useMemo(() => createPageIndex(treeSource), [treeSource]);
  const recent = useMemo(
    () =>
      resolveRecent(recentPaths, pageIndex)
        .slice(0, MAX_RECENT)
        .map<PaletteItem>(({ label, live, path, trail }) => {
          const isDoc = path.startsWith(`/${DOCS_ID}/`);
          return {
            badge: live ? { label: "Live", live: true } : undefined,
            fields: [],
            icon: "clock",
            key: `recent:${path}`,
            path,
            scope: isDoc ? "docs" : "examples",
            subtitle: trail.join(" › "),
            title: [label],
          };
        }),
    [pageIndex, recentPaths],
  );

  return {
    indexes,
    items,
    loading: docs === undefined || tokens === undefined,
    recent,
  };
};
