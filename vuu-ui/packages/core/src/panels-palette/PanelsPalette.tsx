import { useComponentCssInjection } from "@salt-ds/styles";
import {
  AddIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  DragRowIcon,
  GridIcon,
  PinIcon,
  PinSolidIcon,
  RefreshIcon,
  SearchIcon,
} from "@salt-ds/icons";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
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
  getVuuServerCredentials,
  setVuuServerCredentials,
  type VuuServerCredentials,
} from "../auth/VuuServerLogin";
import {
  type ManualVuuServer,
  useManualVuuServers,
} from "../portal-servers/ManualVuuServers";
import { useRetryConnection } from "../server-monitor/VuuServerMonitorProvider";
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
  TABLES_PALETTE_TITLE,
  usePanelsPaletteState,
} from "./PanelsPaletteState";
import {
  ServerTablesLoader,
  type ServerTablesState,
  usePanelsServerOptions,
} from "./ServerTablesLoader";
import { type OpenPanelResult, useOpenPanel } from "./useOpenPanel";
import {
  AddServerDialog,
  type PaletteServer,
  PaletteServers,
  ServerSignInDialog,
} from "./PaletteServers";
import { useRecentPanels } from "./useRecentPanels";

import panelsPaletteCss from "./PanelsPalette.css";

const classBase = "vuuPanelsPalette";

/** Portal saved state key (in `vuu.portal`) for the Tables tab server. */
export const PANELS_PALETTE_SERVER_KEY = "workspace/paletteServer";
/** Portal saved state key for the collapsed servers list of the palette. */
export const PANELS_PALETTE_SERVERS_COLLAPSED_KEY =
  "workspace/paletteServersCollapsed";

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
   * The server the Tables tab lists initially, instead of the user's saved
   * choice. Used even if it is not one of the known servers, so an
   * unreachable server shows its error.
   */
  defaultServerId?: string;
  /** Called with the server whose tables the Tables tab lists. */
  onServerChange?: (serverId: string | undefined) => void;
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
      {/* Tables all share one icon, which adds nothing: the label says it. */}
      {item.kind === "table" ? null : <PanelIcon item={item} />}
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

const SKELETON_WIDTHS = [64, 48, 72, 56, 40];

const TablesLoading = ({ serverId }: { serverId: string }) => (
  <div className={`${classBase}-loading`} role="status">
    <span className={`${classBase}-loadingTitle`}>
      <span aria-hidden className={`${classBase}-spinner`} />
      Loading tables from {serverId}…
    </span>
    {SKELETON_WIDTHS.map((width) => (
      <span aria-hidden className={`${classBase}-skeleton`} key={width}>
        <span style={{ width: `${width}%` }} />
      </span>
    ))}
  </div>
);

const TablesError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  return (
    <div className={`${classBase}-error`}>
      <div className={`${classBase}-errorMessage`} role="alert">
        <strong>Can’t list tables</strong>
        <span>{message}</span>
      </div>
      <button className={`${classBase}-retry`} onClick={onRetry} type="button">
        <RefreshIcon aria-hidden />
        Retry
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
  onServerChange,
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
  const serverOptions = usePanelsServerOptions();
  const {
    addServer,
    removeServer,
    servers: manualServers,
  } = useManualVuuServers();
  const retryConnection = useRetryConnection();
  const servers = useMemo<PaletteServer[]>(() => {
    const manualIds = new Set(
      manualServers.map(({ connectionId }) => connectionId),
    );
    return serverOptions.map(({ connectionId, websocketUrl }) => ({
      connectionId,
      manual: manualIds.has(connectionId),
      websocketUrl,
    }));
  }, [manualServers, serverOptions]);
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
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [activeKey, setActiveKey] = useState<string>();
  const [selectedServerId, setSelectedServerId] = useState(
    () => defaultServerId ?? load<string>(PANELS_PALETTE_SERVER_KEY),
  );
  const [serversCollapsed, setServersCollapsed] = useState(
    () => load<boolean>(PANELS_PALETTE_SERVERS_COLLAPSED_KEY) === true,
  );
  const [adding, setAdding] = useState(false);
  const [signIn, setSignIn] = useState<{ error?: string; serverId: string }>();
  // Servers whose sign-in the user cancelled, so it isn't asked again.
  const [signInDeclined, setSignInDeclined] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [attempt, setAttempt] = useState(0);
  // Tagged with its server, so a newly chosen server shows as loading.
  const [loadedTables, setLoadedTables] = useState<{
    serverId: string;
    state: ServerTablesState;
  }>();
  const listRef = useRef<HTMLDivElement>(null);
  const idBase = useId();

  const serverId =
    selectedServerId !== undefined &&
    (selectedServerId === defaultServerId ||
      servers.some(({ connectionId }) => connectionId === selectedServerId))
      ? selectedServerId
      : servers[0]?.connectionId;
  const tablesState =
    loadedTables !== undefined && loadedTables.serverId === serverId
      ? loadedTables.state
      : LOADING;
  const handleTablesChange = useCallback(
    (state: ServerTablesState) => {
      if (serverId !== undefined) {
        setLoadedTables({ serverId, state });
      }
    },
    [serverId],
  );

  useEffect(() => {
    onServerChange?.(serverId);
  }, [onServerChange, serverId]);

  const manualServer = (id: string | undefined) =>
    manualServers.find(({ connectionId }) => connectionId === id);
  const needsVuuLogin = (id: string | undefined) =>
    manualServer(id)?.auth === "vuu-login";

  const selectServer = useCallback(
    (nextServerId: string) => {
      setSelectedServerId(nextServerId);
      setActiveKey(undefined);
      save(nextServerId, PANELS_PALETTE_SERVER_KEY, {
        group: "Workspaces",
        label: "Tables panel server",
      });
    },
    [save],
  );

  const toggleServers = useCallback(() => {
    setServersCollapsed((value) => {
      save(!value, PANELS_PALETTE_SERVERS_COLLAPSED_KEY, {
        group: "Workspaces",
        label: "Tables panel servers collapsed",
      });
      return !value;
    });
  }, [save]);

  const handleRemoveServer = (connectionId: string) => {
    removeServer(connectionId);
    if (connectionId === serverId) {
      const next = servers.find(
        (server) => server.connectionId !== connectionId,
      );
      if (next) {
        selectServer(next.connectionId);
      }
    }
  };

  const handleAddServer = (
    server: ManualVuuServer,
    credentials?: VuuServerCredentials,
  ) => {
    addServer(server, credentials);
    setAdding(false);
    selectServer(server.connectionId);
  };

  const retryTables = useCallback(() => {
    if (serverId !== undefined) {
      retryConnection(serverId);
      setAttempt((value) => value + 1);
    }
  }, [retryConnection, serverId]);

  // A Vuu login server asks for a username and password: when it has none,
  // or when listing its tables fails, e.g. the password was rejected.
  const vuuLogin = needsVuuLogin(serverId);
  const hasCredentials =
    serverId !== undefined && getVuuServerCredentials(serverId) !== undefined;
  const tablesError =
    tablesState.status === "error" ? tablesState.message : undefined;
  useEffect(() => {
    if (
      tab !== "tables" ||
      serverId === undefined ||
      !vuuLogin ||
      signInDeclined.has(serverId)
    ) {
      return;
    }
    if (!hasCredentials) {
      setSignIn((current) =>
        current?.serverId === serverId ? current : { serverId },
      );
    } else if (tablesError) {
      setSignIn({ error: tablesError, serverId });
    }
  }, [hasCredentials, serverId, signInDeclined, tab, tablesError, vuuLogin]);

  const handleSignIn = (credentials: VuuServerCredentials) => {
    if (!signIn) {
      return;
    }
    setVuuServerCredentials(signIn.serverId, credentials);
    setSignIn(undefined);
    retryTables();
  };

  const cancelSignIn = () => {
    if (signIn) {
      const declined = signIn.serverId;
      setSignInDeclined((current) => new Set(current).add(declined));
    }
    setSignIn(undefined);
  };

  const title = tab === "tables" ? TABLES_PALETTE_TITLE : PANELS_PALETTE_TITLE;
  const setPaletteTitle = paletteState?.setTitle;
  useEffect(() => {
    setPaletteTitle?.(title);
  }, [setPaletteTitle, title]);

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

  // The Tables tab has no search: its list is short, under the servers.
  const activeFilter = tab === "tables" ? "" : filter;
  const filteredGroups = useMemo(
    () => filterPanelItemGroups(groups, activeFilter),
    [activeFilter, groups],
  );
  const filtering = activeFilter.trim() !== "";

  const visibleItems = useMemo(
    () =>
      filteredGroups.flatMap(({ items, label }) =>
        collapsed.has(label) && !filtering ? [] : items,
      ),
    [collapsed, filteredGroups, filtering],
  );

  // No row is active until the user moves to one: nothing looks selected.
  const activeItem = visibleItems.find(({ key }) => key === activeKey);
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
        case "Enter": {
          // From the search box, Enter takes the first match.
          const item =
            activeItem ??
            (event.currentTarget === listRef.current
              ? undefined
              : visibleItems[0]);
          if (item) {
            event.preventDefault();
            if (event.shiftKey) {
              handleAdd(item);
            } else {
              handleOpen(item);
            }
          }
          return;
        }
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
      visibleItems,
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
        : filtering
          ? `No ${tab === "tables" ? "tables" : "panels"} match “${filter.trim()}”`
          : tab === "tables"
            ? "No tables available."
            : "No panels available.";

  const listId = `${idBase}-list`;
  const pinned = paletteState?.pinned ?? false;
  // The Tables tab has no pin: a page that lists tables pins the palette
  // itself (`defaultPinned`).
  const pinButton =
    paletteState && tab !== "tables" ? (
      <button
        aria-label={
          pinned
            ? `Unpin ${title.toLowerCase()}`
            : `Pin ${title.toLowerCase()} open`
        }
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
        aria-label={title}
        className={cx(classBase, className, {
          [`${classBase}-inContextPanel`]: inContextPanel,
        })}
      >
        {inContextPanel ? null : (
          <div className={`${classBase}-title`}>
            <AddIcon aria-hidden />
            <h2>{title}</h2>
            {paletteState ? (
              <>
                {pinButton}
                <button
                  aria-label={`Close ${title.toLowerCase()}`}
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
        {tab === "tables" ? null : (
          <div className={`${classBase}-search`}>
            <SearchIcon aria-hidden />
            <input
              aria-activedescendant={activeRowId}
              aria-controls={listId}
              aria-label="Search panels"
              onChange={(event) => setFilter(event.target.value)}
              onKeyDown={handleListKeyDown}
              placeholder="Search panels"
              type="search"
              value={filter}
            />
            {inContextPanel ? pinButton : null}
          </div>
        )}
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
        {tab === "tables" ? (
          <PaletteServers
            collapsed={serversCollapsed}
            onAdd={() => setAdding(true)}
            onRemove={handleRemoveServer}
            onSelect={selectServer}
            onToggle={toggleServers}
            selectedId={serverId}
            servers={servers}
          />
        ) : null}
        {tab === "tables" && serverId ? (
          <ServerTablesLoader
            key={`${serverId}#${attempt}`}
            onChange={handleTablesChange}
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
          {tab === "tables" && serverId && tablesState.status === "loading" ? (
            <TablesLoading serverId={serverId} />
          ) : tab === "tables" && serverId && tablesState.status === "error" ? (
            <TablesError message={tablesState.message} onRetry={retryTables} />
          ) : filteredGroups.length === 0 ? (
            <div className={`${classBase}-empty`} role="status">
              {emptyMessage}
              {tab === "tables" && filtering ? (
                <span className={`${classBase}-emptyHint`}>
                  Tables from other servers are listed when you choose that
                  server under Tables › Browse.
                </span>
              ) : null}
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
                    <span className={`${classBase}-groupLabel`}>{label}</span>
                    <span className={`${classBase}-groupCount`}>
                      {items.length}
                    </span>
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
          <span>
            <b>Click</b> opens
          </span>
          <span aria-hidden>·</span>
          <span>
            <b>Drag</b> places
          </span>
          <span aria-hidden>·</span>
          <span>
            <b>+</b> adds beside
          </span>
        </div>
        <AddServerDialog
          existingIds={new Set(servers.map(({ connectionId }) => connectionId))}
          onAdd={handleAddServer}
          onClose={() => setAdding(false)}
          open={adding}
        />
        <ServerSignInDialog
          error={signIn?.error}
          onCancel={cancelSignIn}
          onSignIn={handleSignIn}
          server={
            signIn
              ? (servers.find(
                  ({ connectionId }) => connectionId === signIn.serverId,
                ) ?? { connectionId: signIn.serverId })
              : undefined
          }
          username={
            signIn
              ? (getVuuServerCredentials(signIn.serverId)?.username ??
                manualServer(signIn.serverId)?.username)
              : undefined
          }
        />
      </aside>
    </PortalDragSourceScope>
  );

  return contextPanelTarget
    ? createPortal(palette, contextPanelTarget)
    : palette;
};
