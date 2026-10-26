import { useComponentCssInjection } from "@salt-ds/styles";
import {
  AddIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  DatabaseIcon,
  DragRowIcon,
  GridIcon,
  PinIcon,
  PinSolidIcon,
  SearchIcon,
} from "@salt-ds/icons";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useContextPanelSlot } from "../context-panel/ContextPanelSlot";
import { usePersistedState } from "../persistence/PersistenceContext";
import { usePaletteModules } from "../portal-components/palette-modules";
import {
  PortalDragSourceScope,
  usePortalDragSource,
} from "../portal-components/usePortalDragSource";
import {
  filterPanelItemGroups,
  modulePanelItem,
  type PanelItem,
  type PanelItemGroup,
  tablePanelItem,
} from "./panel-items";
import {
  PANELS_PALETTE_TITLE,
  usePanelsPaletteState,
} from "./PanelsPaletteState";
import {
  ServerTablesLoader,
  type ServerTablesState,
  usePanelsServerOptions,
} from "./ServerTablesLoader";
import { type OpenPanelResult, useOpenPanel } from "./useOpenPanel";
import { useRecentPanels } from "./useRecentPanels";

import panelsPaletteCss from "./PanelsPalette.css";

const classBase = "vuuPanelsPalette";

/** Portal saved state key (in `vuu.portal`) for the Tables tab server. */
export const PANELS_PALETTE_SERVER_KEY = "workspace/paletteServer";

export type PanelsPaletteTab = "modules" | "tables" | "recent";

const TAB_LABELS: Record<PanelsPaletteTab, string> = {
  modules: "Modules",
  recent: "Recent",
  tables: "Tables",
};

/**
 * The tabs of the palette when `tabs` is not set. Tables, which lists the
 * raw tables of a Vuu server, is opt-in: hosts that want a table offer it as
 * a pre-configured module instead.
 */
export const DEFAULT_PANELS_PALETTE_TABS: readonly PanelsPaletteTab[] = [
  "modules",
  "recent",
];

const getTabs = (tabs?: readonly PanelsPaletteTab[]) => {
  const ids = Array.from(
    new Set((tabs ?? []).filter((id) => id in TAB_LABELS)),
  );
  return (ids.length > 0 ? ids : DEFAULT_PANELS_PALETTE_TABS).map((id) => ({
    id,
    label: TAB_LABELS[id],
  }));
};

const RECENT_GROUP = "Recently added";

export interface PanelsPaletteProps {
  className?: string;
  /**
   * The server initially selected on the Tables tab, instead of the user's
   * saved choice. Selected even if it is not one of the known servers, so an
   * unreachable server shows its error.
   */
  defaultServerId?: string;
  /**
   * The tab shown initially. Default: the first of `tabs`. Ignored if it is
   * not one of `tabs`.
   */
  defaultTab?: PanelsPaletteTab;
  /**
   * The tabs offered, in order. Default `["modules", "recent"]`: the Tables
   * tab is opt-in, e.g. `["modules", "tables", "recent"]`. With a single
   * tab, the tab strip is not shown.
   */
  tabs?: readonly PanelsPaletteTab[];
}

const PanelIcon = ({ item }: { item: PanelItem }) => (
  <span aria-hidden className={`${classBase}-icon`}>
    {item.iconUrl ? (
      <img alt="" src={item.iconUrl} />
    ) : item.kind === "table" ? (
      <GridIcon />
    ) : (
      <DashboardIcon />
    )}
  </span>
);

interface PanelRowProps {
  active: boolean;
  id: string;
  item: PanelItem;
  onAdd: (item: PanelItem) => void;
  onDropped: (item: PanelItem) => void;
  onOpen: (item: PanelItem) => void;
  onPointerActivate: (item: PanelItem) => void;
}

const PanelRow = ({
  active,
  id,
  item,
  onAdd,
  onDropped,
  onOpen,
  onPointerActivate,
}: PanelRowProps) => {
  const [dragging, setDragging] = useState(false);
  const handleDragEnd = useCallback(
    (dropped: boolean) => {
      setDragging(false);
      if (dropped) {
        onDropped(item);
      }
    },
    [item, onDropped],
  );
  const { onDragStart, ...dragProps } = usePortalDragSource(item.template, {
    onDragEnd: handleDragEnd,
  });
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>) => {
      setDragging(true);
      onDragStart(event);
    },
    [onDragStart],
  );
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox handles keys for its active row (aria-activedescendant)
    <div
      {...dragProps}
      aria-selected={active}
      className={`${classBase}-row`}
      data-active={active || undefined}
      data-dragging={dragging || undefined}
      data-key={item.key}
      id={id}
      onClick={() => onOpen(item)}
      onDragStart={handleDragStart}
      onPointerDown={() => onPointerActivate(item)}
      role="option"
    >
      <span aria-hidden className={`${classBase}-grip`}>
        <DragRowIcon />
      </span>
      <PanelIcon item={item} />
      <span className={`${classBase}-text`}>
        <span className={`${classBase}-label`}>{item.label}</span>
        {item.kind === "module" && item.subtitle ? (
          <span className={`${classBase}-subtitle`}>{item.subtitle}</span>
        ) : null}
      </span>
      <button
        aria-label={`Add ${item.label}`}
        className={`${classBase}-add`}
        onClick={(event) => {
          event.stopPropagation();
          onAdd(item);
        }}
        tabIndex={-1}
        title="Add to workspace"
        type="button"
      >
        <AddIcon aria-hidden />
      </button>
    </div>
  );
};

const groupTables = (
  serverId: string,
  state: ServerTablesState,
): PanelItemGroup[] => {
  if (state.status !== "loaded") {
    return [];
  }
  const groups = new Map<string, PanelItem[]>();
  for (const { module, table } of state.tables) {
    const item = tablePanelItem(serverId, module, table);
    const group = groups.get(module);
    if (group) {
      group.push(item);
    } else {
      groups.set(module, [item]);
    }
  }
  return Array.from(groups, ([label, items]) => ({
    items: items.sort((a, b) => a.label.localeCompare(b.label)),
    label,
  }));
};

const LOADING: ServerTablesState = { status: "loading" };

/**
 * The Panels palette: the modules, Vuu tables and recently added panels that
 * can be opened in the workspace. Drag a row onto the workspace to place it,
 * press its + to add it, or click it to open it (see `useOpenPanel`).
 *
 * Rendered by `PortalWorkspace`, within the workspace's GridLayoutProvider
 * and `OpenPanelProvider`, when there is an `AddPanelButton`. Within the
 * shell's context panel, it is displayed there (with a React portal, so it
 * stays in the workspace's React tree) while its `PanelsPaletteState` owns
 * the panel. Otherwise it is displayed in place, with its own header.
 */
export const PanelsPalette = ({
  className,
  defaultServerId,
  defaultTab,
  tabs: tabsProp,
}: PanelsPaletteProps) => {
  useComponentCssInjection({
    testId: "vuu-panels-palette",
    css: panelsPaletteCss,
    window: useWindow(),
  });
  const paletteState = usePanelsPaletteState();
  const contextPanelSlot = useContextPanelSlot();
  const inContextPanel =
    paletteState !== undefined && contextPanelSlot !== undefined;
  const { addPanel, openPanel } = useOpenPanel();
  const { load, save } = usePersistedState();
  const paletteModules = usePaletteModules();
  const servers = usePanelsServerOptions();
  const [recent, addRecentPanel] = useRecentPanels();
  // Keyed on the tab ids, so an inline `tabs` array doesn't recompute them.
  const tabsKey = tabsProp?.join() ?? "";
  const tabs = useMemo(
    () => getTabs(tabsKey.split(",") as PanelsPaletteTab[]),
    [tabsKey],
  );
  const [selectedTab, setTab] = useState<PanelsPaletteTab>(
    () => tabs.find(({ id }) => id === defaultTab)?.id ?? tabs[0].id,
  );
  const tab = tabs.some(({ id }) => id === selectedTab)
    ? selectedTab
    : tabs[0].id;
  const tablesTab = tabs.some(({ id }) => id === "tables");
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [activeKey, setActiveKey] = useState<string>();
  const [savedServerId, setSavedServerId] = useState(
    () => defaultServerId ?? load<string>(PANELS_PALETTE_SERVER_KEY),
  );
  const [tablesState, setTablesState] = useState<ServerTablesState>(LOADING);
  const listRef = useRef<HTMLDivElement>(null);
  const idBase = useId();

  const serverId =
    savedServerId !== undefined &&
    (savedServerId === defaultServerId ||
      servers.some(({ connectionId }) => connectionId === savedServerId))
      ? savedServerId
      : servers[0]?.connectionId;
  const serverOptions = useMemo(
    () =>
      serverId === undefined ||
      servers.some(({ connectionId }) => connectionId === serverId)
        ? servers
        : [...servers, { connectionId: serverId }],
    [serverId, servers],
  );

  const groups = useMemo<PanelItemGroup[]>(() => {
    switch (tab) {
      case "modules":
        return paletteModules.map(({ modules, paletteGroup }) => ({
          items: modules.map(modulePanelItem),
          label: paletteGroup,
        }));
      case "tables":
        return serverId ? groupTables(serverId, tablesState) : [];
      default:
        return recent.length > 0
          ? [{ items: recent, label: RECENT_GROUP }]
          : [];
    }
  }, [paletteModules, recent, serverId, tab, tablesState]);

  const filteredGroups = useMemo(
    () => filterPanelItemGroups(groups, filter),
    [filter, groups],
  );
  const filtering = filter.trim() !== "";

  const visibleItems = useMemo(
    () =>
      filteredGroups.flatMap(({ items, label }) =>
        collapsed.has(label) && !filtering ? [] : items,
      ),
    [collapsed, filteredGroups, filtering],
  );

  const activeItem =
    visibleItems.find(({ key }) => key === activeKey) ?? visibleItems[0];
  const rowId = (item: PanelItem) => `${idBase}-${item.key}`;

  const activeRowId = activeItem ? rowId(activeItem) : undefined;

  useEffect(() => {
    if (activeRowId) {
      document
        .getElementById(activeRowId)
        ?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeRowId]);

  const closeUnlessPinned = useCallback(() => {
    if (paletteState && !paletteState.pinned) {
      paletteState.setOpen(false);
    }
  }, [paletteState]);

  const handleOpened = useCallback(
    (item: PanelItem, result: OpenPanelResult) => {
      if (result.action !== "cancel") {
        addRecentPanel(item);
        closeUnlessPinned();
      }
    },
    [addRecentPanel, closeUnlessPinned],
  );

  const handleOpen = useCallback(
    (item: PanelItem) => {
      setActiveKey(item.key);
      openPanel(item.template, { defaultSize: item.defaultSize })
        .then((result) => handleOpened(item, result))
        .catch((error: unknown) =>
          console.warn("[PanelsPalette] unable to open %s", item.label, error),
        );
    },
    [handleOpened, openPanel],
  );

  const handleAdd = useCallback(
    (item: PanelItem) => {
      setActiveKey(item.key);
      try {
        handleOpened(
          item,
          addPanel(item.template, { defaultSize: item.defaultSize }),
        );
      } catch (error) {
        console.warn("[PanelsPalette] unable to add %s", item.label, error);
      }
    },
    [addPanel, handleOpened],
  );

  const handleDropped = useCallback(
    (item: PanelItem) => {
      addRecentPanel(item);
      closeUnlessPinned();
    },
    [addRecentPanel, closeUnlessPinned],
  );

  const handlePointerActivate = useCallback(
    (item: PanelItem) => setActiveKey(item.key),
    [],
  );

  const toggleGroup = useCallback((label: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(label)) {
        next.add(label);
      }
      return next;
    });
  }, []);

  const handleServerChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextServerId = event.target.value;
      setSavedServerId(nextServerId);
      setTablesState(LOADING);
      save(nextServerId, PANELS_PALETTE_SERVER_KEY, {
        group: "Workspaces",
        label: "Panels palette server",
      });
    },
    [save],
  );

  const moveActive = useCallback(
    (delta: number | "first" | "last") => {
      if (visibleItems.length === 0) {
        return;
      }
      const index = activeItem ? visibleItems.indexOf(activeItem) : -1;
      const nextIndex =
        delta === "first"
          ? 0
          : delta === "last"
            ? visibleItems.length - 1
            : Math.min(visibleItems.length - 1, Math.max(0, index + delta));
      setActiveKey(visibleItems[nextIndex].key);
    },
    [activeItem, visibleItems],
  );

  const handleListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          return moveActive(1);
        case "ArrowUp":
          event.preventDefault();
          return moveActive(-1);
        case "Home":
          if (event.currentTarget === listRef.current) {
            event.preventDefault();
            moveActive("first");
          }
          return;
        case "End":
          if (event.currentTarget === listRef.current) {
            event.preventDefault();
            moveActive("last");
          }
          return;
        case "Enter":
          if (activeItem) {
            event.preventDefault();
            if (event.shiftKey) {
              handleAdd(activeItem);
            } else {
              handleOpen(activeItem);
            }
          }
          return;
        case "+":
          if (activeItem && event.currentTarget === listRef.current) {
            event.preventDefault();
            handleAdd(activeItem);
          }
          return;
        case "Escape":
          // The context panel closes itself on Escape.
          if (paletteState && !paletteState.pinned && !inContextPanel) {
            event.preventDefault();
            paletteState.setOpen(false);
          }
          return;
      }
    },
    [
      activeItem,
      handleAdd,
      handleOpen,
      moveActive,
      paletteState,
      inContextPanel,
    ],
  );

  if (paletteState && !paletteState.open) {
    return null;
  }
  const contextPanelTarget = inContextPanel
    ? contextPanelSlot.owner === paletteState.contextPanelOwner
      ? contextPanelSlot.target
      : null
    : undefined;
  if (contextPanelTarget === null) {
    return null;
  }

  const emptyMessage =
    tab === "recent" && recent.length === 0
      ? "Panels you add appear here."
      : tab === "tables" && !serverId
        ? "No Vuu servers available."
        : tab === "tables" && tablesState.status === "loading"
          ? "Loading tables..."
          : tab === "tables" && tablesState.status === "error"
            ? tablesState.message
            : filtering
              ? `No panels match "${filter.trim()}".`
              : "No panels available.";

  const listId = `${idBase}-list`;
  const pinned = paletteState?.pinned ?? false;
  const pinButton = paletteState ? (
    <button
      aria-label={pinned ? "Unpin panels" : "Pin panels open"}
      aria-pressed={pinned}
      className={`${classBase}-iconButton`}
      onClick={() => paletteState.setPinned(!pinned)}
      title={pinned ? "Unpin" : "Pin open"}
      type="button"
    >
      {pinned ? <PinSolidIcon aria-hidden /> : <PinIcon aria-hidden />}
    </button>
  ) : null;

  const palette = (
    <PortalDragSourceScope>
      <aside
        aria-label={PANELS_PALETTE_TITLE}
        className={cx(classBase, className, {
          [`${classBase}-inContextPanel`]: inContextPanel,
        })}
      >
        {inContextPanel ? null : (
          <div className={`${classBase}-title`}>
            <AddIcon aria-hidden />
            <h2>{PANELS_PALETTE_TITLE}</h2>
            {paletteState ? (
              <>
                {pinButton}
                <button
                  aria-label="Close panels"
                  className={`${classBase}-iconButton`}
                  onClick={() => paletteState.setOpen(false)}
                  title="Close"
                  type="button"
                >
                  <CloseIcon aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        )}
        <div className={`${classBase}-search`}>
          <SearchIcon aria-hidden />
          <input
            aria-activedescendant={activeRowId}
            aria-controls={listId}
            aria-label={
              tablesTab ? "Search panels and tables" : "Search panels"
            }
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={handleListKeyDown}
            placeholder={tablesTab ? "Search panels & tables" : "Search panels"}
            type="search"
            value={filter}
          />
          {inContextPanel ? pinButton : null}
        </div>
        {tabs.length > 1 ? (
          <div
            aria-label="Panel sources"
            className={`${classBase}-tabs`}
            role="tablist"
          >
            {tabs.map(({ id, label }) => (
              <button
                aria-controls={listId}
                aria-selected={tab === id}
                className={`${classBase}-tab`}
                key={id}
                onClick={() => {
                  setTab(id);
                  setActiveKey(undefined);
                }}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {tab === "tables" && serverOptions.length > 0 ? (
          <label className={`${classBase}-server`}>
            <span>Server</span>
            <span className={`${classBase}-serverSelect`}>
              <DatabaseIcon aria-hidden />
              <select onChange={handleServerChange} value={serverId}>
                {serverOptions.map(({ connectionId, websocketUrl }) => (
                  <option key={connectionId} value={connectionId}>
                    {websocketUrl
                      ? `${connectionId} · ${websocketUrl}`
                      : connectionId}
                  </option>
                ))}
              </select>
              <ChevronDownIcon aria-hidden />
            </span>
          </label>
        ) : null}
        {tab === "tables" && serverId ? (
          <ServerTablesLoader
            key={serverId}
            onChange={setTablesState}
            serverId={serverId}
          />
        ) : null}
        <div
          aria-activedescendant={activeRowId}
          aria-label={tabs.find(({ id }) => id === tab)?.label}
          className={`${classBase}-list`}
          id={listId}
          onKeyDown={handleListKeyDown}
          ref={listRef}
          role="listbox"
          tabIndex={0}
        >
          {filteredGroups.length === 0 ? (
            <div className={`${classBase}-empty`} role="status">
              {emptyMessage}
            </div>
          ) : (
            filteredGroups.map(({ items, label }) => {
              const expanded = filtering || !collapsed.has(label);
              return (
                <div
                  aria-label={label}
                  className={`${classBase}-group`}
                  key={label}
                  role="group"
                >
                  <button
                    aria-expanded={expanded}
                    className={`${classBase}-groupHeader`}
                    onClick={() => toggleGroup(label)}
                    tabIndex={-1}
                    type="button"
                  >
                    {expanded ? (
                      <ChevronDownIcon aria-hidden />
                    ) : (
                      <ChevronRightIcon aria-hidden />
                    )}
                    {label}
                  </button>
                  {expanded
                    ? items.map((item) => (
                        <PanelRow
                          active={item === activeItem}
                          id={rowId(item)}
                          item={item}
                          key={item.key}
                          onAdd={handleAdd}
                          onDropped={handleDropped}
                          onOpen={handleOpen}
                          onPointerActivate={handlePointerActivate}
                        />
                      ))
                    : null}
                </div>
              );
            })
          )}
        </div>
        <div className={`${classBase}-footer`}>
          Drag onto the workspace, or press + to add
        </div>
      </aside>
    </PortalDragSourceScope>
  );

  return contextPanelTarget
    ? createPortal(palette, contextPanelTarget)
    : palette;
};
