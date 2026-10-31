import type {
  DocumentSummary,
  EntrySummary,
} from "../persistence/PersistenceBackend";
import type { ClearSelection } from "../persistence/PortalPersistenceService";
import {
  PORTAL_APPLICATION_KEY,
  PORTAL_APPLICATION_VERSION,
} from "../persistence/StateDocument";
import {
  formatAbsoluteTime,
  formatAccessibleSize,
  formatRelativeTime,
  formatSize,
  plural,
} from "./saved-state-format";

/** An application the portal knows about, in navigation order. */
export interface SavedStateApplicationInfo {
  applicationKey: string;
  title: string;
  /** The version the portal currently runs; earlier ones are "previous". */
  version?: number;
}

export type SavedStateNodeKind =
  | "application"
  | "group"
  | "entry"
  | "not-carried-forward-group"
  | "not-carried-forward"
  | "previous-versions"
  | "document"
  | "unavailable"
  | "removed"
  | "unreadable";

export interface SavedStateNode {
  id: string;
  kind: SavedStateNodeKind;
  applicationKey: string;
  label: string;
  /** The raw key, shown in secondary monospace text. */
  detail?: string;
  /** Right-aligned metadata. */
  meta: string;
  accessibleName: string;
  /** Absolute timestamp or the reason an item wasn't carried forward. */
  tooltip?: string;
  open?: boolean;
  tag?: "Not carried forward" | "No longer available";
  unreadable?: boolean;
  /** Text matched by the search box (§9.5). */
  searchText: readonly string[];
  children?: readonly SavedStateNode[];
}

export type SavedStateLeaf = {
  applicationKey: string;
  applicationTitle: string;
  label: string;
  /** Number of items the leaf stands for, for the selection summary. */
  weight: number;
} & (
  | { kind: "entry"; applicationVersion: number; key: string }
  | { kind: "not-carried-forward"; applicationVersion: number; key: string }
  | { kind: "document"; applicationVersion: number }
  | { kind: "removed"; applicationVersions: readonly number[] }
  | { kind: "unreadable"; applicationVersion: number }
);

export interface SavedStateApplicationModel {
  applicationKey: string;
  title: string;
  open: boolean;
  node: SavedStateNode;
}

export interface SavedStateModel {
  applications: readonly SavedStateApplicationModel[];
  unavailable?: SavedStateNode;
  leaves: ReadonlyMap<string, SavedStateLeaf>;
  /** Entry and not-carried-forward keys of each document, by document id. */
  documents: ReadonlyMap<
    string,
    { entries: readonly string[]; notCarriedForward: readonly string[] }
  >;
  empty: boolean;
}

export interface BuildSavedStateModelOptions {
  summaries: readonly DocumentSummary[];
  /**
   * Applications in navigation order. When omitted, every document's
   * application is treated as available.
   */
  applications?: readonly SavedStateApplicationInfo[];
  portalTitle?: string;
  isOpen?: (applicationKey: string, applicationVersion: number) => boolean;
  now?: Date;
}

export const nodeId = (...parts: Array<string | number>) =>
  JSON.stringify(parts);

const documentId = (applicationKey: string, applicationVersion: number) =>
  nodeId("document", applicationKey, applicationVersion);

const isEmptySummary = (summary: DocumentSummary) =>
  !summary.unreadable &&
  summary.entries.length === 0 &&
  (summary.notCarriedForward?.length ?? 0) === 0;

const latest = (timestamps: readonly string[]) =>
  timestamps.reduce<string | undefined>(
    (max, value) => (max === undefined || value > max ? value : max),
    undefined,
  );

const metaText = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" · ");

const accessibleText = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(", ");

const lastSaved = (summary: DocumentSummary) =>
  summary.updatedAt ||
  latest(summary.entries.map(({ updatedAt }) => updatedAt)) ||
  "";

/** Builds the Saved state tree from the backend's document summaries. */
export const buildSavedStateModel = ({
  applications,
  isOpen = () => false,
  now = new Date(),
  portalTitle = "Portal",
  summaries,
}: BuildSavedStateModelOptions): SavedStateModel => {
  const leaves = new Map<string, SavedStateLeaf>();
  const documents = new Map<
    string,
    { entries: readonly string[]; notCarriedForward: readonly string[] }
  >();
  const registry = new Map<string, SavedStateApplicationInfo>();
  registry.set(PORTAL_APPLICATION_KEY, {
    applicationKey: PORTAL_APPLICATION_KEY,
    title: portalTitle,
    version: PORTAL_APPLICATION_VERSION,
  });
  for (const application of applications ?? []) {
    if (!registry.has(application.applicationKey)) {
      registry.set(application.applicationKey, application);
    }
  }

  const byApplication = new Map<string, DocumentSummary[]>();
  const unreadable: DocumentSummary[] = [];
  for (const summary of summaries) {
    if (summary.unreadable) {
      unreadable.push(summary);
    } else if (!isEmptySummary(summary)) {
      const list = byApplication.get(summary.applicationKey) ?? [];
      list.push(summary);
      byApplication.set(summary.applicationKey, list);
    }
  }

  const titleOf = (applicationKey: string, docs: readonly DocumentSummary[]) =>
    registry.get(applicationKey)?.title ??
    [...docs]
      .sort((a, b) => b.applicationVersion - a.applicationVersion)
      .find(({ applicationTitle }) => applicationTitle)?.applicationTitle ??
    applicationKey;

  const entryNode = (
    applicationKey: string,
    applicationTitle: string,
    applicationVersion: number,
    entry: EntrySummary,
  ): SavedStateNode => {
    const id = nodeId("entry", applicationKey, applicationVersion, entry.key);
    const label = entry.label ?? entry.key;
    const time = formatRelativeTime(entry.updatedAt, now);
    leaves.set(id, {
      kind: "entry",
      applicationKey,
      applicationTitle,
      applicationVersion,
      key: entry.key,
      label,
      weight: 1,
    });
    return {
      id,
      kind: "entry",
      applicationKey,
      label,
      detail: entry.label ? entry.key : undefined,
      meta: metaText(formatSize(entry.size), time),
      accessibleName: accessibleText(
        label,
        time,
        formatAccessibleSize(entry.size),
      ),
      tooltip: formatAbsoluteTime(entry.updatedAt),
      searchText: [label, entry.key],
    };
  };

  const applicationNode = (
    applicationKey: string,
    docs: DocumentSummary[],
  ): SavedStateApplicationModel => {
    const title = titleOf(applicationKey, docs);
    const currentVersion = registry.get(applicationKey)?.version;
    const sorted = [...docs].sort(
      (a, b) => b.applicationVersion - a.applicationVersion,
    );
    const main =
      sorted.find(
        ({ applicationVersion }) => applicationVersion === currentVersion,
      ) ?? sorted[0];
    const previous = sorted.filter((doc) => doc !== main);
    const version = main.applicationVersion;
    const open = isOpen(applicationKey, version);

    documents.set(documentId(applicationKey, version), {
      entries: main.entries.map(({ key }) => key),
      notCarriedForward: (main.notCarriedForward ?? []).map(({ key }) => key),
    });

    const children: SavedStateNode[] = [];
    const groups = new Map<string, EntrySummary[]>();
    const ungrouped: EntrySummary[] = [];
    for (const entry of main.entries) {
      if (entry.group) {
        const list = groups.get(entry.group) ?? [];
        list.push(entry);
        groups.set(entry.group, list);
      } else {
        ungrouped.push(entry);
      }
    }
    for (const [group, entries] of groups) {
      const count = plural(entries.length, "item");
      children.push({
        id: nodeId("group", applicationKey, version, group),
        kind: "group",
        applicationKey,
        label: group,
        meta: count,
        accessibleName: accessibleText(group, count),
        searchText: [group],
        children: entries.map((entry) =>
          entryNode(applicationKey, title, version, entry),
        ),
      });
    }
    for (const entry of ungrouped) {
      children.push(entryNode(applicationKey, title, version, entry));
    }

    const notCarriedForward = main.notCarriedForward ?? [];
    if (notCarriedForward.length > 0) {
      const count = plural(notCarriedForward.length, "item");
      children.push({
        id: nodeId("not-carried-forward-group", applicationKey, version),
        kind: "not-carried-forward-group",
        applicationKey,
        label: "Not carried forward",
        meta: count,
        accessibleName: accessibleText("Not carried forward", count),
        searchText: ["Not carried forward"],
        children: notCarriedForward.map((record) => {
          const id = nodeId(
            "not-carried-forward",
            applicationKey,
            version,
            record.key,
          );
          const label = record.label ?? record.key;
          leaves.set(id, {
            kind: "not-carried-forward",
            applicationKey,
            applicationTitle: title,
            applicationVersion: version,
            key: record.key,
            label,
            weight: 1,
          });
          const from = `From version ${record.fromVersion}`;
          return {
            id,
            kind: "not-carried-forward",
            applicationKey,
            label,
            detail: record.label ? record.key : undefined,
            meta: from,
            accessibleName: accessibleText(
              label,
              "not carried forward",
              record.reason,
            ),
            tag: "Not carried forward",
            tooltip: record.reason,
            searchText: [label, record.key, record.group ?? ""],
          };
        }),
      });
    }

    if (previous.length > 0) {
      const count = plural(previous.length, "version");
      children.push({
        id: nodeId("previous-versions", applicationKey),
        kind: "previous-versions",
        applicationKey,
        label: "Previous versions",
        meta: count,
        accessibleName: accessibleText("Previous versions", count),
        searchText: [],
        children: previous.map((doc) => {
          const id = documentId(applicationKey, doc.applicationVersion);
          const items =
            doc.entries.length + (doc.notCarriedForward?.length ?? 0);
          const label = `Version ${doc.applicationVersion}`;
          const time = formatRelativeTime(lastSaved(doc), now);
          leaves.set(id, {
            kind: "document",
            applicationKey,
            applicationTitle: title,
            applicationVersion: doc.applicationVersion,
            label,
            weight: Math.max(1, items),
          });
          return {
            id,
            kind: "document",
            applicationKey,
            label,
            meta: metaText(plural(items, "item"), formatSize(doc.size), time),
            accessibleName: accessibleText(
              label,
              plural(items, "item"),
              time,
              formatAccessibleSize(doc.size),
            ),
            tooltip: formatAbsoluteTime(lastSaved(doc)),
            searchText: [],
          };
        }),
      });
    }

    const items = main.entries.length;
    const time = formatRelativeTime(lastSaved(main), now);
    const carriedForward =
      main.carriedForwardFrom === undefined
        ? undefined
        : `Carried forward from version ${main.carriedForwardFrom}`;
    return {
      applicationKey,
      title,
      open,
      node: {
        id: nodeId("application", applicationKey),
        kind: "application",
        applicationKey,
        label: title,
        open,
        meta: metaText(
          `Version ${version}`,
          carriedForward,
          plural(items, "item"),
          formatSize(main.size),
          time,
        ),
        accessibleName: accessibleText(
          title,
          open && "open",
          `version ${version}`,
          carriedForward?.toLowerCase(),
          plural(items, "item"),
          formatAccessibleSize(main.size),
          `saved ${time.toLowerCase()}`,
        ),
        tooltip: formatAbsoluteTime(lastSaved(main)),
        searchText: [],
        children,
      },
    };
  };

  const available: SavedStateApplicationModel[] = [];
  const removed: Array<[string, DocumentSummary[]]> = [];
  for (const [applicationKey, docs] of byApplication) {
    if (applications === undefined || registry.has(applicationKey)) {
      available.push(applicationNode(applicationKey, docs));
    } else {
      removed.push([applicationKey, docs]);
    }
  }
  const order = [...registry.keys()];
  const rank = (applicationKey: string) => {
    const index = order.indexOf(applicationKey);
    return index === -1 ? order.length : index;
  };
  available.sort(
    (a, b) =>
      rank(a.applicationKey) - rank(b.applicationKey) ||
      a.title.localeCompare(b.title),
  );

  const unavailableChildren: SavedStateNode[] = [];
  for (const [applicationKey, docs] of removed) {
    const title = titleOf(applicationKey, docs);
    const id = nodeId("removed", applicationKey);
    const newest = [...docs].sort(
      (a, b) => b.applicationVersion - a.applicationVersion,
    )[0];
    const size = docs.reduce((total, doc) => total + doc.size, 0);
    const items = docs.reduce(
      (total, doc) =>
        total + doc.entries.length + (doc.notCarriedForward?.length ?? 0),
      0,
    );
    const time = formatRelativeTime(lastSaved(newest), now);
    leaves.set(id, {
      kind: "removed",
      applicationKey,
      applicationTitle: title,
      applicationVersions: docs.map(
        ({ applicationVersion }) => applicationVersion,
      ),
      label: title,
      weight: Math.max(1, items),
    });
    unavailableChildren.push({
      id,
      kind: "removed",
      applicationKey,
      label: title,
      tag: "No longer available",
      meta: metaText(
        `Version ${newest.applicationVersion}`,
        formatSize(size),
        time,
      ),
      accessibleName: accessibleText(
        title,
        "no longer available",
        `version ${newest.applicationVersion}`,
        formatAccessibleSize(size),
        `saved ${time.toLowerCase()}`,
      ),
      tooltip: formatAbsoluteTime(lastSaved(newest)),
      searchText: [title, applicationKey],
    });
  }
  for (const doc of unreadable) {
    const { applicationKey, applicationVersion } = doc;
    const title =
      registry.get(applicationKey)?.title ??
      doc.applicationTitle ??
      applicationKey;
    const id = nodeId("unreadable", applicationKey, applicationVersion);
    leaves.set(id, {
      kind: "unreadable",
      applicationKey,
      applicationTitle: title,
      applicationVersion,
      label: `Version ${applicationVersion}`,
      weight: 1,
    });
    const time = formatRelativeTime(doc.updatedAt, now);
    unavailableChildren.push({
      id,
      kind: "unreadable",
      applicationKey,
      label: title,
      unreadable: true,
      meta: metaText(
        `Version ${applicationVersion}`,
        formatSize(doc.size),
        time,
      ),
      accessibleName: accessibleText(
        title,
        "unreadable data",
        `version ${applicationVersion}`,
        formatAccessibleSize(doc.size),
      ),
      searchText: [title, applicationKey],
    });
  }

  const unavailable: SavedStateNode | undefined =
    unavailableChildren.length > 0
      ? {
          id: nodeId("unavailable"),
          kind: "unavailable",
          applicationKey: "",
          label: "Unavailable applications",
          meta: metaText(
            plural(unavailableChildren.length, "application"),
            "can only be cleared",
          ),
          accessibleName: accessibleText(
            "Unavailable applications",
            plural(unavailableChildren.length, "application"),
            "can only be cleared",
          ),
          searchText: [],
          children: unavailableChildren,
        }
      : undefined;

  return {
    applications: available,
    unavailable,
    leaves,
    documents,
    empty: available.length === 0 && unavailable === undefined,
  };
};

// ------------------------------------------------------------ filtering

export const ALL_APPLICATIONS = "*";

export interface SavedStateView {
  nodes: readonly SavedStateNode[];
  /** Ancestors of search matches, which are shown expanded (§9.5). */
  matchedAncestors: readonly string[];
}

const matches = (node: SavedStateNode, query: string) =>
  node.searchText.some((text) => text.toLowerCase().includes(query));

const filterNode = (
  node: SavedStateNode,
  query: string,
  ancestors: string[],
): SavedStateNode | undefined => {
  if (matches(node, query)) return node;
  if (!node.children) return undefined;
  const children = node.children
    .map((child) => filterNode(child, query, ancestors))
    .filter((child): child is SavedStateNode => child !== undefined);
  if (children.length === 0) return undefined;
  ancestors.push(node.id);
  return { ...node, children };
};

/** Applies the **Show** scope and the search text to the tree. */
export const filterSavedStateModel = (
  model: SavedStateModel,
  {
    scope = ALL_APPLICATIONS,
    search = "",
  }: { scope?: string; search?: string },
): SavedStateView => {
  const roots =
    scope === ALL_APPLICATIONS
      ? [
          ...model.applications.map(({ node }) => node),
          ...(model.unavailable ? [model.unavailable] : []),
        ]
      : model.applications
          .filter(({ applicationKey }) => applicationKey === scope)
          .map(({ node }) => node);
  const query = search.trim().toLowerCase();
  if (query === "") {
    return { nodes: roots, matchedAncestors: [] };
  }
  const matchedAncestors: string[] = [];
  const nodes = roots
    .map((node) => filterNode(node, query, matchedAncestors))
    .filter((node): node is SavedStateNode => node !== undefined);
  return { nodes, matchedAncestors };
};

// ------------------------------------------------------------ selection

export const collectLeafIds = (
  nodes: readonly SavedStateNode[],
  target: string[] = [],
) => {
  for (const node of nodes) {
    if (node.children) {
      collectLeafIds(node.children, target);
    } else {
      target.push(node.id);
    }
  }
  return target;
};

export const collectParentIds = (
  nodes: readonly SavedStateNode[],
  target: string[] = [],
) => {
  for (const node of nodes) {
    if (node.children) {
      target.push(node.id);
      collectParentIds(node.children, target);
    }
  }
  return target;
};

/**
 * The Tree's controlled `selected`: the selected leaves that are shown, plus
 * every shown parent whose shown leaves are all selected (§9.13).
 */
export const toTreeSelection = (
  nodes: readonly SavedStateNode[],
  selection: ReadonlySet<string>,
) => {
  const selected: string[] = [];
  const visit = (node: SavedStateNode): boolean => {
    if (!node.children) {
      const isSelected = selection.has(node.id);
      if (isSelected) selected.push(node.id);
      return isSelected;
    }
    let all = true;
    for (const child of node.children) {
      if (!visit(child)) all = false;
    }
    if (all) selected.push(node.id);
    return all;
  };
  for (const node of nodes) visit(node);
  return selected;
};

/**
 * Merges a Tree selection change into the selection, keeping selected items
 * that are hidden by the search or scope.
 */
export const fromTreeSelection = (
  nodes: readonly SavedStateNode[],
  selection: ReadonlySet<string>,
  treeSelected: readonly string[],
) => {
  const shown = new Set(collectLeafIds(nodes));
  const next = new Set([...selection].filter((id) => !shown.has(id)));
  for (const id of treeSelected) {
    if (shown.has(id)) next.add(id);
  }
  return next;
};

/** Drops selected items that no longer exist, e.g. after a refresh. */
export const pruneSelection = (
  model: SavedStateModel,
  selection: ReadonlySet<string>,
) => {
  const next = new Set([...selection].filter((id) => model.leaves.has(id)));
  return next.size === selection.size ? selection : next;
};

export const summariseSelection = (
  model: SavedStateModel,
  selection: ReadonlySet<string>,
) => {
  let items = 0;
  const applications = new Set<string>();
  for (const id of selection) {
    const leaf = model.leaves.get(id);
    if (leaf) {
      items += leaf.weight;
      applications.add(leaf.applicationKey);
    }
  }
  return { items, applications: applications.size };
};

export const formatSelectionSummary = ({
  applications,
  items,
}: {
  items: number;
  applications: number;
}) =>
  items === 0
    ? "Nothing selected"
    : `${plural(items, "item")} selected in ${plural(applications, "application")}`;

/** Converts the selection into the service's ClearSelection. */
export const toClearSelection = (
  model: SavedStateModel,
  selection: ReadonlySet<string>,
): ClearSelection => {
  type Item = {
    applicationKey: string;
    applicationVersion: number;
    keys: string[];
    notCarriedForward: string[];
    whole: boolean;
    unreadable: boolean;
  };
  const items = new Map<string, Item>();
  const item = (applicationKey: string, applicationVersion: number) => {
    const id = documentId(applicationKey, applicationVersion);
    let value = items.get(id);
    if (!value) {
      value = {
        applicationKey,
        applicationVersion,
        keys: [],
        notCarriedForward: [],
        whole: false,
        unreadable: false,
      };
      items.set(id, value);
    }
    return value;
  };
  for (const id of selection) {
    const leaf = model.leaves.get(id);
    if (!leaf) continue;
    switch (leaf.kind) {
      case "entry":
        item(leaf.applicationKey, leaf.applicationVersion).keys.push(leaf.key);
        break;
      case "not-carried-forward":
        item(
          leaf.applicationKey,
          leaf.applicationVersion,
        ).notCarriedForward.push(leaf.key);
        break;
      case "document":
        item(leaf.applicationKey, leaf.applicationVersion).whole = true;
        break;
      case "removed":
        for (const version of leaf.applicationVersions) {
          item(leaf.applicationKey, version).whole = true;
        }
        break;
      case "unreadable":
        item(leaf.applicationKey, leaf.applicationVersion).unreadable = true;
        break;
    }
  }
  return [...items.entries()].map(([id, value]) => {
    const { applicationKey, applicationVersion } = value;
    if (value.unreadable) {
      return { applicationKey, applicationVersion, unreadable: true };
    }
    const doc = model.documents.get(id);
    const whole =
      value.whole ||
      (doc?.entries.every((key) => value.keys.includes(key)) === true &&
        doc.notCarriedForward.every((key) =>
          value.notCarriedForward.includes(key),
        ));
    if (whole) return { applicationKey, applicationVersion };
    return {
      applicationKey,
      applicationVersion,
      keys: value.keys,
      ...(value.notCarriedForward.length > 0
        ? { notCarriedForward: value.notCarriedForward }
        : {}),
    };
  });
};

export interface ClearDescription {
  applicationKey: string;
  title: string;
  /** e.g. "Saved filters, Sort order", "all saved state". */
  description: string;
  open: boolean;
}

/** One line per application for the confirmation (§9.6), in tree order. */
export const describeSelection = (
  model: SavedStateModel,
  selection: ReadonlySet<string>,
): ClearDescription[] => {
  const lines: ClearDescription[] = [];
  const roots = [
    ...model.applications.map(({ node, open }) => ({ node, open })),
    ...(model.unavailable?.children ?? []).map((node) => ({
      node,
      open: false,
    })),
  ];
  for (const { node, open } of roots) {
    const leafIds = collectLeafIds([node]);
    const selected = leafIds.filter((id) => selection.has(id));
    if (selected.length === 0) continue;
    const title =
      node.kind === "application" || node.kind === "removed"
        ? node.label
        : (model.leaves.get(selected[0])?.applicationTitle ?? node.label);
    if (node.kind === "unreadable") {
      lines.push({
        applicationKey: node.applicationKey,
        title,
        description: `${model.leaves.get(node.id)?.label} (all items)`,
        open: false,
      });
    } else if (selected.length === leafIds.length) {
      lines.push({
        applicationKey: node.applicationKey,
        title,
        description: "all saved state",
        open,
      });
    } else {
      const parts: string[] = [];
      const versions: string[] = [];
      for (const id of selected) {
        const leaf = model.leaves.get(id);
        if (leaf?.kind === "document") {
          versions.push(`${leaf.label} (all items)`);
        } else if (leaf) {
          parts.push(leaf.label);
        }
      }
      if (parts.length > 0) {
        lines.push({
          applicationKey: node.applicationKey,
          title,
          description: parts.join(", "),
          open,
        });
      }
      for (const description of versions) {
        lines.push({
          applicationKey: node.applicationKey,
          title,
          description,
          open: false,
        });
      }
    }
  }
  return lines;
};
