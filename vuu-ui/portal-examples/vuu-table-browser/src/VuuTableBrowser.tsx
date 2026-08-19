import {
  Button,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Spinner,
  VerticalNavigation,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemExpansionIcon,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
  VerticalNavigationSubMenu,
} from "@salt-ds/core";
import {
  TableRegistrationContext,
  type TableSourceStatus,
  useModuleRegistry,
  useVuuServers,
  type VuuServerDescriptor,
} from "@vuu-ui/core";
import { RemoteModule, usePersistedState } from "@vuu-ui/core/portal";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AddServerForm, type ManualServer } from "./AddServerForm";

import "./VuuTableBrowser.css";

/** The registry module that provides the table viewer remote. */
const VIEWER_CLIENT_IDENTIFIER = "vuu-table-viewer";

const MANUAL_SERVERS_KEY = "manualServers";
const MANUAL_SERVERS_METADATA = {
  group: "Servers",
  label: "Manually added Vuu servers",
};
const NO_MANUAL_SERVERS: ManualServer[] = [];

interface BrowsableServer {
  description: string;
  /** Entered by the user, rather than referenced by a registered module. */
  manual: boolean;
  sourceId: string;
  title: string;
  vuu: RemoteModuleConnection;
}

interface SourceState {
  message?: string;
  status: TableSourceStatus;
  tables: VuuTable[];
}

interface TableRoute {
  sourceId: string;
  table: VuuTable;
}

const toBrowsableServer = ({
  connectionId,
  moduleTitles,
  restUrl,
  websocketUrl,
}: VuuServerDescriptor): BrowsableServer => ({
  description: `Used by ${moduleTitles.join(", ")}`,
  manual: false,
  sourceId: connectionId,
  title: connectionId,
  vuu: {
    connectionId,
    ...(restUrl === undefined ? {} : { restUrl }),
    ...(websocketUrl === undefined ? {} : { websocketUrl }),
  },
});

const manualToBrowsableServer = ({
  connectionId,
  restUrl,
  websocketUrl,
}: ManualServer): BrowsableServer => ({
  description: `Added manually: ${websocketUrl}`,
  manual: true,
  sourceId: connectionId,
  title: connectionId,
  vuu: { connectionId, restUrl, websocketUrl },
});

const compareTables = (left: VuuTable, right: VuuTable) =>
  left.module.localeCompare(right.module) ||
  left.table.localeCompare(right.table);

const tableRoute = (sourceId: string, table: VuuTable) =>
  [sourceId, table.module, table.table].map(encodeURIComponent).join("/");

const parseTableRoute = (route: string | undefined): TableRoute | undefined => {
  if (!route) {
    return undefined;
  }

  const segments = route.split("/");
  if (segments.length !== 3) {
    return undefined;
  }

  try {
    return {
      sourceId: decodeURIComponent(segments[0]),
      table: {
        module: decodeURIComponent(segments[1]),
        table: decodeURIComponent(segments[2]),
      },
    };
  } catch {
    return undefined;
  }
};

/**
 * The browser's own path, without the table route. Relative paths such as
 * "." resolve against the full splat, so strip its segments instead.
 */
export const browserBasePath = (pathname: string, routePath = "") => {
  const segments = pathname.replace(/\/$/, "").split("/");
  const route = routePath.replace(/\/$/, "");
  const routeSegments = route ? route.split("/").length : 0;
  return segments.slice(0, segments.length - routeSegments).join("/");
};

const sameTable = (left: VuuTable, right: VuuTable) =>
  left.module === right.module && left.table === right.table;

const SourceNavigation = ({
  basePath,
  expanded,
  module,
  onExpandedChange,
  onRemove,
  onRetry,
  route,
  source,
}: {
  basePath: string;
  expanded: boolean;
  module: BrowsableServer;
  onExpandedChange: (sourceId: string, expanded: boolean) => void;
  onRemove: (sourceId: string) => void;
  onRetry: (sourceId: string) => void;
  route?: TableRoute;
  source?: SourceState;
}) => {
  const location = useLocation();
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const table of source?.tables ?? []) {
      counts.set(table.table, (counts.get(table.table) ?? 0) + 1);
    }
    return counts;
  }, [source?.tables]);

  return (
    <VerticalNavigationItem active={route?.sourceId === module.sourceId}>
      <Collapsible
        onOpenChange={(_, open) => onExpandedChange(module.sourceId, open)}
        open={expanded}
      >
        <VerticalNavigationItemContent>
          <CollapsibleTrigger>
            <VerticalNavigationItemTrigger>
              <VerticalNavigationItemLabel title={module.description}>
                {module.title}
              </VerticalNavigationItemLabel>
              <VerticalNavigationItemExpansionIcon />
            </VerticalNavigationItemTrigger>
          </CollapsibleTrigger>
        </VerticalNavigationItemContent>
        <CollapsiblePanel>
          <VerticalNavigationSubMenu>
            {source?.status === "loading" ? (
              <div className="vuuTableBrowser-source-status" role="status">
                <Spinner aria-label={`Loading tables from ${module.title}`} />
                <span>Loading tables...</span>
              </div>
            ) : null}
            {source?.status === "error" ? (
              <div className="vuuTableBrowser-source-status" role="alert">
                <span>{source.message ?? "Unable to load tables"}</span>
                <Button onClick={() => onRetry(module.sourceId)}>Retry</Button>
              </div>
            ) : null}
            {source?.status === "ready" && source.tables.length === 0 ? (
              <div className="vuuTableBrowser-source-status">
                No tables available
              </div>
            ) : null}
            {source?.tables.map((table) => {
              const path = tableRoute(module.sourceId, table);
              const selected =
                route?.sourceId === module.sourceId &&
                sameTable(route.table, table);
              const label =
                duplicateNames.get(table.table) === 1
                  ? table.table
                  : `${table.module}: ${table.table}`;

              return (
                <VerticalNavigationItem active={selected} key={path}>
                  <VerticalNavigationItemContent>
                    <Link
                      to={{
                        pathname: `${basePath}/${path}`,
                        search: location.search,
                      }}
                    >
                      <VerticalNavigationItemLabel title={label}>
                        {label}
                      </VerticalNavigationItemLabel>
                    </Link>
                  </VerticalNavigationItemContent>
                </VerticalNavigationItem>
              );
            })}
            {module.manual ? (
              <div className="vuuTableBrowser-source-status">
                <Button
                  appearance="transparent"
                  onClick={() => onRemove(module.sourceId)}
                >
                  Remove server
                </Button>
              </div>
            ) : null}
          </VerticalNavigationSubMenu>
        </CollapsiblePanel>
      </Collapsible>
    </VerticalNavigationItem>
  );
};

export default function VuuTableBrowser() {
  const { modules: registeredModules } = useModuleRegistry();
  const vuuServers = useVuuServers();
  const routePath = useParams()["*"];
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = browserBasePath(location.pathname, routePath);
  const route = useMemo(() => parseTableRoute(routePath), [routePath]);
  const invalidRoute = Boolean(routePath && !route);
  const [activated, setActivated] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<Record<string, SourceState>>({});
  const [addingServer, setAddingServer] = useState(false);
  const { load, save } = usePersistedState();
  const [manualServers, setManualServers] = useState<ManualServer[]>(
    () => load<ManualServer[]>(MANUAL_SERVERS_KEY) ?? NO_MANUAL_SERVERS,
  );
  const saveManualServers = useCallback(
    (servers: ManualServer[]) => {
      setManualServers(servers);
      save(servers, MANUAL_SERVERS_KEY, MANUAL_SERVERS_METADATA);
    },
    [save],
  );

  const modules = useMemo(() => {
    const registered = vuuServers
      .map(toBrowsableServer)
      .sort((left, right) => left.title.localeCompare(right.title));
    const registeredIds = new Set(registered.map(({ sourceId }) => sourceId));
    // A registered server takes precedence over a manual one of the same name.
    const manual = manualServers
      .filter(({ connectionId }) => !registeredIds.has(connectionId))
      .map(manualToBrowsableServer);
    return registered.concat(manual);
  }, [manualServers, vuuServers]);

  const serverIds = useMemo(
    () => new Set(modules.map(({ sourceId }) => sourceId)),
    [modules],
  );

  const viewer = useMemo(() => {
    const descriptor = registeredModules.find(
      ({ clientIdentifier }) => clientIdentifier === VIEWER_CLIENT_IDENTIFIER,
    );
    return descriptor
      ? {
          clientIdentifier: descriptor.clientIdentifier,
          mfComponent: descriptor.mfComponent,
          mfScope: descriptor.mfScope,
          mfUrl: descriptor.mfUrl,
          version: descriptor.version,
        }
      : undefined;
  }, [registeredModules]);

  useEffect(() => {
    if (route && modules?.some(({ sourceId }) => sourceId === route.sourceId)) {
      setActivated((current) => new Set(current).add(route.sourceId));
      setExpanded((current) => new Set(current).add(route.sourceId));
      setSources((current) =>
        current[route.sourceId]
          ? current
          : {
              ...current,
              [route.sourceId]: { status: "loading", tables: [] },
            },
      );
    }
  }, [modules, route]);

  const registerTables = useCallback((sourceId: string, tables: VuuTable[]) => {
    setSources((current) => ({
      ...current,
      [sourceId]: {
        ...current[sourceId],
        status: "ready",
        tables: [...tables].sort(compareTables),
      },
    }));
  }, []);

  const reportSourceStatus = useCallback(
    (sourceId: string, status: TableSourceStatus, message?: string) => {
      setSources((current) => ({
        ...current,
        [sourceId]: {
          message,
          status,
          tables: current[sourceId]?.tables ?? [],
        },
      }));
    },
    [],
  );

  const unregisterTables = useCallback((sourceId: string) => {
    setSources((current) =>
      current[sourceId]
        ? {
            ...current,
            [sourceId]: { ...current[sourceId], tables: [] },
          }
        : current,
    );
  }, []);

  const handleExpandedChange = useCallback(
    (sourceId: string, isExpanded: boolean) => {
      setExpanded((current) => {
        const next = new Set(current);
        if (isExpanded) {
          next.add(sourceId);
        } else {
          next.delete(sourceId);
        }
        return next;
      });
      if (isExpanded) {
        setActivated((current) => new Set(current).add(sourceId));
        setSources((current) =>
          current[sourceId]
            ? current
            : {
                ...current,
                [sourceId]: { status: "loading", tables: [] },
              },
        );
      }
    },
    [],
  );

  const handleRetrySource = useCallback((sourceId: string) => {
    setSources((current) => ({
      ...current,
      [sourceId]: { status: "loading", tables: [] },
    }));
    setRetryCount((current) => ({
      ...current,
      [sourceId]: (current[sourceId] ?? 0) + 1,
    }));
  }, []);

  const handleViewerError = useCallback(
    (sourceId: string, error: Error) => {
      reportSourceStatus(sourceId, "error", error.message);
    },
    [reportSourceStatus],
  );

  const handleAddServer = useCallback(
    (server: ManualServer) => {
      saveManualServers(manualServers.concat(server));
      setAddingServer(false);
    },
    [manualServers, saveManualServers],
  );

  const handleRemoveServer = useCallback(
    (sourceId: string) => {
      saveManualServers(
        manualServers.filter(({ connectionId }) => connectionId !== sourceId),
      );
      const withoutSource = (current: Set<string>) => {
        const next = new Set(current);
        next.delete(sourceId);
        return next;
      };
      setActivated(withoutSource);
      setExpanded(withoutSource);
      setSources(({ [sourceId]: _, ...rest }) => rest);
      setRetryCount(({ [sourceId]: _, ...rest }) => rest);
      if (route?.sourceId === sourceId) {
        navigate({ pathname: basePath, search: location.search });
      }
    },
    [
      basePath,
      location.search,
      manualServers,
      navigate,
      route?.sourceId,
      saveManualServers,
    ],
  );

  const routeModule = route
    ? modules.find(({ sourceId }) => sourceId === route.sourceId)
    : undefined;
  const selectedTable =
    route && routeModule
      ? sources[route.sourceId]?.tables.find((table) =>
          sameTable(table, route.table),
        )
      : undefined;
  const selectedSource = route ? sources[route.sourceId] : undefined;
  const selectedSourceId = route?.sourceId;

  const registrationContext = useMemo(
    () => ({
      registerTables,
      reportSourceStatus,
      selectedTable:
        selectedSourceId && selectedTable
          ? { sourceId: selectedSourceId, table: selectedTable }
          : undefined,
      unregisterTables,
    }),
    [
      registerTables,
      reportSourceStatus,
      selectedSourceId,
      selectedTable,
      unregisterTables,
    ],
  );

  if (!viewer) {
    return (
      <div className="vuuTableBrowser">
        <main className="vuuTableBrowser-content">
          <div className="vuuTableBrowser-centered" role="alert">
            The Vuu table viewer is not available. Register a module with
            clientIdentifier "{VIEWER_CLIENT_IDENTIFIER}".
          </div>
        </main>
      </div>
    );
  }

  return (
    <TableRegistrationContext.Provider value={registrationContext}>
      <div className="vuuTableBrowser">
        <aside className="vuuTableBrowser-nav" aria-label="Vuu servers">
          {modules.length === 0 ? (
            <div className="vuuTableBrowser-source-status">
              No Vuu servers available
            </div>
          ) : (
            <VerticalNavigation>
              {modules.map((module) => (
                <SourceNavigation
                  basePath={basePath}
                  expanded={expanded.has(module.sourceId)}
                  key={module.sourceId}
                  module={module}
                  onExpandedChange={handleExpandedChange}
                  onRemove={handleRemoveServer}
                  onRetry={handleRetrySource}
                  route={route}
                  source={sources[module.sourceId]}
                />
              ))}
            </VerticalNavigation>
          )}
          {addingServer ? (
            <AddServerForm
              existingIds={serverIds}
              onAdd={handleAddServer}
              onCancel={() => setAddingServer(false)}
            />
          ) : (
            <div className="vuuTableBrowser-source-status">
              <Button onClick={() => setAddingServer(true)}>Add server</Button>
            </div>
          )}
        </aside>
        <main className="vuuTableBrowser-content">
          {!route ? (
            <div className="vuuTableBrowser-centered">
              {invalidRoute
                ? "The requested table route is invalid."
                : "Select a server and table to begin."}
            </div>
          ) : null}
          {route && !routeModule ? (
            <div className="vuuTableBrowser-centered" role="alert">
              The requested Vuu server was not found.
            </div>
          ) : null}
          {routeModule &&
          (!selectedSource || selectedSource.status === "loading") ? (
            <div className="vuuTableBrowser-centered" role="status">
              <Spinner aria-label="Loading requested table" />
              <span>Loading requested table...</span>
            </div>
          ) : null}
          {routeModule && selectedSource?.status === "error" ? (
            <div className="vuuTableBrowser-centered" role="alert">
              <span>
                {selectedSource.message ??
                  "Unable to load the requested server"}
              </span>
              <Button onClick={() => handleRetrySource(routeModule.sourceId)}>
                Retry
              </Button>
            </div>
          ) : null}
          {routeModule &&
          selectedSource?.status === "ready" &&
          !selectedTable ? (
            <div className="vuuTableBrowser-centered" role="alert">
              The requested table was not found.
            </div>
          ) : null}
          {modules
            .filter(({ sourceId }) => activated.has(sourceId))
            .map((module) => {
              const isSelected = module.sourceId === route?.sourceId;
              return (
                <div
                  className="vuuTableBrowser-viewer"
                  hidden={!isSelected || !selectedTable}
                  key={`${module.sourceId}:${retryCount[module.sourceId] ?? 0}`}
                >
                  <Suspense
                    fallback={
                      <div className="vuuTableBrowser-centered" role="status">
                        <Spinner aria-label={`Loading ${module.title}`} />
                      </div>
                    }
                  >
                    <RemoteModule
                      {...viewer}
                      onError={(error) =>
                        handleViewerError(module.sourceId, error)
                      }
                      title={module.title}
                      vuu={module.vuu}
                    />
                  </Suspense>
                </div>
              );
            })}
        </main>
      </div>
    </TableRegistrationContext.Provider>
  );
}
