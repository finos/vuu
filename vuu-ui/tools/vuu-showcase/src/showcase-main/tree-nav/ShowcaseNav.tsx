import type { TreeNodeFilterProps } from "@vuu-ui/vuu-data-local";
import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavFilter } from "./NavFilter";
import {
  EMPTY_NAV_FILTER,
  isNavFilterActive,
  matchesNavFilter,
  type NavFilterState,
} from "./nav-filter";
import { recentStore, useFavourites, useRecent } from "./nav-store";
import {
  buildSectionTree,
  createNavIndex,
  type NavNodeData,
  sectionFromPath,
  type ShowcaseSection,
} from "./nav-tree";
import { createNavRowAdornmentRenderer } from "./NavRowAdornment";
import { TreeNavPanel } from "./TreeNavPanel";

export const NAV_FILTER_INPUT_SELECTOR = ".ShowcaseNavFilter-input";

type NavSection = Exclude<ShowcaseSection, "theme">;

const createSectionNav = (
  section: NavSection,
  treeSource: TreeSourceNode<NavNodeData>[],
) => {
  const tree = buildSectionTree(section, treeSource);
  const navIndex = createNavIndex(tree);
  return {
    navIndex,
    renderAdornment: createNavRowAdornmentRenderer(navIndex),
    tree,
  };
};

export interface ShowcaseNavProps {
  exampleCount: number;
  onSelectExample?: (nodeData?: NavNodeData) => void;
  treeSource: TreeSourceNode[];
}

/**
 * The showcase sidebar, presents the nav tree for the current section (from
 * the url) with filter, chips, favourites and recent. Self contained, reads
 * all state from the router and nav stores, as it is rendered within a
 * GridLayout which does not re-render its items when props change.
 */
export const ShowcaseNav = ({
  exampleCount,
  onSelectExample,
  treeSource,
}: ShowcaseNavProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);

  const sectionNavs = useMemo(() => {
    const source = treeSource as TreeSourceNode<NavNodeData>[];
    return {
      docs: createSectionNav("docs", source),
      examples: createSectionNav("examples", source),
    };
  }, [treeSource]);
  const sectionNav = section === "theme" ? undefined : sectionNavs[section];
  const navIndex = sectionNav?.navIndex;

  // autoSelectRowKey determines the initial selection only, so it is held
  // stable within a section. A changing value would cause the table to
  // re-bind its dataSource (and reset scroll position) on every navigation.
  const [initialSelection, setInitialSelection] = useState({
    key: sectionNav?.navIndex.keyForPath(pathname),
    sectionNav,
  });
  if (initialSelection.sectionNav !== sectionNav) {
    setInitialSelection({
      key: sectionNav?.navIndex.keyForPath(pathname),
      sectionNav,
    });
  }

  useEffect(() => {
    if (sectionNavs.examples.navIndex.isPagePath(pathname)) {
      recentStore.push(pathname.replace(/(.)\/$/, "$1"));
    }
  }, [pathname, sectionNavs]);

  // The filter is reset whenever the section changes
  const [navFilterState, setNavFilterState] = useState<{
    filter: NavFilterState;
    section: ShowcaseSection;
  }>({ filter: EMPTY_NAV_FILTER, section });
  const navFilter =
    navFilterState.section === section
      ? navFilterState.filter
      : EMPTY_NAV_FILTER;
  const handleNavFilterChange = useCallback(
    (filter: NavFilterState) => setNavFilterState({ filter, section }),
    [section],
  );

  const favourites = useFavourites();
  const recent = useRecent();
  // only depend on the lists when the filter uses them, so the filter (and
  // any nodes collapsed while filtering) is not reset as they change
  const chipFavourites = navFilter.chip === "favourites" ? favourites : null;
  const chipRecent = navFilter.chip === "recent" ? recent : null;
  const filterPredicate = useMemo(() => {
    if (navIndex && isNavFilterActive(navFilter)) {
      const context = {
        favourites: chipFavourites ?? [],
        pathForKey: navIndex.pathForKey,
        recent: chipRecent ?? [],
      };
      return (node: TreeNodeFilterProps) =>
        matchesNavFilter(navFilter, context, node);
    }
  }, [chipFavourites, chipRecent, navFilter, navIndex]);

  const handleSelect = useCallback<TableRowSelectHandler>(
    (dataRow) => {
      if (dataRow && navIndex) {
        const path = navIndex.pathForKey(dataRow.key);
        if (path !== undefined && path !== pathname) {
          onSelectExample?.(dataRow.nodeData as NavNodeData | undefined);
          navigate(path);
        }
      }
    },
    [navIndex, navigate, onSelectExample, pathname],
  );

  if (sectionNav === undefined) {
    return null;
  }

  return (
    <TreeNavPanel
      autoSelectRowKey={
        initialSelection.sectionNav === sectionNav
          ? initialSelection.key
          : sectionNav.navIndex.keyForPath(pathname)
      }
      className="ShowcaseNav"
      filterPredicate={filterPredicate}
      header={
        <NavFilter
          filter={navFilter}
          onChange={handleNavFilterChange}
          placeholder={
            section === "examples"
              ? `Filter ${exampleCount} examples`
              : "Filter docs"
          }
          showChips={section === "examples"}
        />
      }
      onSelect={handleSelect}
      renderNodeAdornment={sectionNav.renderAdornment}
      searchPattern={navFilter.query.trim()}
      source={sectionNav.tree}
      topLevelHeadings={section === "examples"}
    />
  );
};
