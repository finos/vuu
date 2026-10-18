import type { TreeNodeFilterProps } from "@vuu-ui/vuu-data-local";
import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import {
  TreeItemContextMenu,
  type TreeItemMenuState,
} from "./TreeItemContextMenu";
import { TreeNavPanel } from "./TreeNavPanel";
import { openInNewTab } from "../doc-tabs/doc-tabs-actions";
import { docTabHref } from "../doc-tabs/doc-tabs-model";
import { docTabsStore } from "../doc-tabs/doc-tabs-store";
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

/** The example a tree row represents, from the marker in its adornment */
const exampleFromEvent = (evt: SyntheticEvent) => {
  const row = (evt.target as HTMLElement).closest("[role='row']");
  const marker = row?.querySelector<HTMLElement>("[data-nav-path]");
  if (marker?.dataset.navPath) {
    return {
      label: marker.dataset.navLabel ?? marker.dataset.navPath,
      path: marker.dataset.navPath,
    };
  }
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
          // an example already open in a tab is shown in that tab
          const tab = docTabsStore.findByPath(path);
          navigate(tab ? docTabHref(tab) : path);
        }
      }
    },
    [navIndex, navState.key, navigate, onSelectExample, route],
  );

  // Opened from a menu or modified click, the row has not been selected by
  // the tree, the route change re-mounts the tree to select it.
  const openExample = useCallback(
    (path: string, newTab = false) => {
      if (newTab) {
        openInNewTab(path, navigate);
      } else {
        const tab = docTabsStore.findByPath(path);
        navigate(tab ? docTabHref(tab) : path);
      }
    },
    [navigate],
  );

  const [menu, setMenu] = useState<TreeItemMenuState>();

  const handleContextMenu = useCallback((evt: MouseEvent) => {
    const example = exampleFromEvent(evt);
    if (example) {
      // captured, the table would otherwise show its own context menu
      evt.preventDefault();
      evt.stopPropagation();
      setMenu({ ...example, position: { x: evt.clientX, y: evt.clientY } });
    }
  }, []);

  // ⌘-click (ctrl-click) and middle-click open an example in a new tab
  const handleClickCapture = useCallback(
    (evt: MouseEvent) => {
      if (evt.metaKey || evt.ctrlKey) {
        const example = exampleFromEvent(evt);
        if (example) {
          evt.preventDefault();
          evt.stopPropagation();
          openExample(example.path, true);
        }
      }
    },
    [openExample],
  );
  const handleAuxClick = useCallback(
    (evt: MouseEvent) => {
      const example = evt.button === 1 ? exampleFromEvent(evt) : undefined;
      if (example) {
        evt.preventDefault();
        openExample(example.path, true);
      }
    },
    [openExample],
  );
  const handleMouseDown = useCallback((evt: MouseEvent) => {
    // no auto scroll, middle-click opens a tab
    if (evt.button === 1 && exampleFromEvent(evt)) {
      evt.preventDefault();
    }
  }, []);
  const handleKeyDownCapture = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === "Enter" && (evt.metaKey || evt.ctrlKey)) {
        const example = exampleFromEvent(evt);
        if (example) {
          evt.preventDefault();
          evt.stopPropagation();
          openExample(example.path, true);
        }
      }
    },
    [openExample],
  );

  if (sectionNav === undefined) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates events from tree rows
    <div
      className="ShowcaseNav-events"
      onAuxClick={handleAuxClick}
      onClickCapture={handleClickCapture}
      onContextMenuCapture={handleContextMenu}
      onKeyDownCapture={handleKeyDownCapture}
      onMouseDown={handleMouseDown}
    >
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
      <TreeItemContextMenu
        menu={menu}
        onClose={() => setMenu(undefined)}
        onOpen={(path) => {
          setMenu(undefined);
          openExample(path);
        }}
        treeSource={treeSource as TreeSourceNode<NavNodeData>[]}
      />
    </div>
  );
};
