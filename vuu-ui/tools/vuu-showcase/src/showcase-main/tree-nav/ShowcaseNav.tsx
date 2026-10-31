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
  getNavFromForPath,
  type NavNodeData,
  sectionFromPath,
  type ShowcaseSection,
} from "./nav-tree";
import { createNavRowAdornmentRenderer } from "./NavRowAdornment";
import { TreeNavPanel } from "./TreeNavPanel";
import { WorkspacesNav } from "../workspace/WorkspacesNav";

export const NAV_FILTER_INPUT_SELECTOR = ".ShowcaseNavFilter-input";

/** Focuses (and selects the content of) the sidebar filter input */
export const focusNavFilter = () => {
  const input = document.querySelector<HTMLInputElement>(
    `.ShowcaseNav ${NAV_FILTER_INPUT_SELECTOR}`,
  );
  input?.focus();
  input?.select();
};

type NavSection = Exclude<ShowcaseSection, "theme">;

const normalisePath = (pathname: string) => pathname.replace(/(.)\/$/, "$1");

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
  const { pathname, state: locationState } = useLocation();
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
  // A route opened from another page in this section, e.g an example opened
  // from the document that embeds it, keeps that page highlighted.
  const navFrom = getNavFromForPath(locationState, pathname);
  const keyForRoute = (route: string) =>
    sectionNav?.navIndex.keyForNearestPath(navFrom ?? route);

  // autoSelectRowKey determines the initial selection only. Selections made
  // in the nav itself need no help, but when the route changes by some other
  // means (home page links, back button) the tree is re-mounted, to select
  // and reveal the new route. A changing autoSelectRowKey alone would not
  // achieve this, and would reset the scroll position of the tree.
  const route = normalisePath(pathname);
  const [navState, setNavState] = useState(() => ({
    generation: 0,
    key: keyForRoute(route),
    route,
    sectionNav,
  }));
  if (navState.sectionNav !== sectionNav || navState.route !== route) {
    const isExternalNavigation = navState.sectionNav === sectionNav;
    setNavState({
      generation: navState.generation + (isExternalNavigation ? 1 : 0),
      key: keyForRoute(route),
      route,
      sectionNav,
    });
  }

  useEffect(() => {
    if (sectionNavs.examples.navIndex.isPagePath(pathname)) {
      recentStore.push(route);
    }
  }, [pathname, route, sectionNavs]);

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
      // The row selected for the current route may be its nearest ancestor,
      // e.g the chapter of an example embedded in a document. Its (auto)
      // selection must not navigate away from the route.
      if (dataRow && navIndex && dataRow.key !== navState.key) {
        const path = navIndex.pathForKey(dataRow.key);
        if (path !== undefined && path !== route) {
          onSelectExample?.(dataRow.nodeData as NavNodeData | undefined);
          // the nav already reflects this route
          setNavState((state) => ({ ...state, key: dataRow.key, route: path }));
          navigate(path);
        }
      }
    },
    [navIndex, navState.key, navigate, onSelectExample, route],
  );

  if (sectionNav === undefined) {
    return null;
  }

  return (
    <TreeNavPanel
      autoSelectRowKey={navState.key}
      className="ShowcaseNav"
      filterPredicate={filterPredicate}
      footer={section === "examples" ? <WorkspacesNav /> : undefined}
      key={navState.generation}
      indentGuides
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
