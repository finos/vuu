import { workspaceIdFromPath } from "../workspace/workspace-model";

export type DocTabKind = "example" | "workspace";

/**
 * A document (example or workspace) open in a tab. The url of the active tab
 * is the url of the page, the search is remembered so that switching back to
 * a tab restores its preview settings and inner tab (Preview, Compare etc).
 */
export interface DocTab {
  id: string;
  path: string;
  /** location.search, including the leading '?', or empty */
  search: string;
}

export interface DocTabsState {
  activeId?: string;
  tabs: DocTab[];
}

export const EMPTY_DOC_TABS: DocTabsState = { tabs: [] };

export const docTabKind = (path: string): DocTabKind =>
  workspaceIdFromPath(path) === undefined ? "example" : "workspace";

export const docTabHref = ({
  path,
  search,
}: Pick<DocTab, "path" | "search">) =>
  search && search !== "?"
    ? `${path}${search.startsWith("?") ? "" : "?"}${search}`
    : path;

let idCount = 0;
export const createDocTabId = () =>
  `tab-${Date.now().toString(36)}${(idCount++).toString(36)}`;

const isDocTab = (value: unknown): value is DocTab =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as DocTab).id === "string" &&
  typeof (value as DocTab).path === "string" &&
  typeof (value as DocTab).search === "string";

/** Validates persisted state, discarding anything unrecognised */
export const parseDocTabsState = (value: unknown): DocTabsState => {
  if (typeof value !== "object" || value === null) {
    return EMPTY_DOC_TABS;
  }
  const { activeId, tabs } = value as Partial<DocTabsState>;
  if (!Array.isArray(tabs)) {
    return EMPTY_DOC_TABS;
  }
  const paths = new Set<string>();
  const validTabs = tabs.filter((tab): tab is DocTab => {
    if (isDocTab(tab) && !paths.has(tab.path)) {
      paths.add(tab.path);
      return true;
    }
    return false;
  });
  return {
    activeId: validTabs.some((tab) => tab.id === activeId)
      ? activeId
      : validTabs[0]?.id,
    tabs: validTabs,
  };
};

/**
 * Which tabs are shown in a strip of the given width, the rest are listed in
 * an overflow menu. Tabs are shown in order while they fit, the active tab is
 * always shown. Returns the indices of the visible tabs.
 */
export const fitTabs = ({
  activeIndex,
  available,
  gap,
  overflowWidth,
  widths,
}: {
  activeIndex: number;
  available: number;
  gap: number;
  overflowWidth: number;
  widths: number[];
}): number[] => {
  const all = widths.map((_, i) => i);
  const total = widths.reduce(
    (sum, width, i) => sum + width + (i > 0 ? gap : 0),
    0,
  );
  if (total <= available) {
    return all;
  }
  let remaining = available - overflowWidth - gap;
  const visible = new Set<number>();
  if (activeIndex >= 0 && activeIndex < widths.length) {
    visible.add(activeIndex);
    remaining -= widths[activeIndex];
  }
  for (const i of all) {
    if (i !== activeIndex) {
      const required = widths[i] + gap;
      if (required > remaining) {
        break;
      }
      visible.add(i);
      remaining -= required;
    }
  }
  return all.filter((i) => visible.has(i));
};
