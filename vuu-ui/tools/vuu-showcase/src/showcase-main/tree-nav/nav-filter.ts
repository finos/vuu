import type { TreeNodeFilterProps } from "@vuu-ui/vuu-data-local";
import type { NavNodeData } from "./nav-tree";

export type NavFilterChip = "live" | "fixtures" | "favourites" | "recent";

export interface NavFilterState {
  chip?: NavFilterChip;
  query: string;
}

export const EMPTY_NAV_FILTER: NavFilterState = { query: "" };

export const isNavFilterActive = ({ chip, query }: NavFilterState) =>
  chip !== undefined || query.trim() !== "";

export interface NavFilterContext {
  favourites: string[];
  pathForKey: (key: string) => string | undefined;
  recent: string[];
}

/**
 * Tests a single nav tree node against the filter. Text is matched, case
 * insensitive, against label, tags, description and the names of ancestor
 * folders, so a folder name query reveals the folder content. Headings never
 * match themselves, they are displayed when any descendant matches.
 */
export const matchesNavFilter = (
  { query, chip }: NavFilterState,
  { favourites, pathForKey, recent }: NavFilterContext,
  { key, label, nodeData }: TreeNodeFilterProps,
) => {
  const data = (nodeData ?? {}) as NavNodeData;
  if (data.heading) {
    return false;
  }
  if (chip === "live" && !data.live) {
    return false;
  }
  if (chip === "fixtures" && !data.fixtureFor?.length) {
    return false;
  }
  const path = pathForKey(key);
  if (chip === "favourites" || chip === "recent") {
    const paths = chip === "favourites" ? favourites : recent;
    if (path === undefined || !paths.includes(path)) {
      return false;
    }
  }
  const text = query.trim().toLowerCase();
  if (text === "") {
    return true;
  }
  return (
    label.toLowerCase().includes(text) ||
    (data.tags ?? []).some((tag) => tag.toLowerCase().includes(text)) ||
    (data.description ?? "").toLowerCase().includes(text) ||
    (path ?? "")
      .split("/")
      .slice(1, -1)
      .some((segment) => segment.toLowerCase().includes(text))
  );
};
