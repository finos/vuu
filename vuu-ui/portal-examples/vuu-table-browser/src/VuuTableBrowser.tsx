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
import { RemoteModule, type RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import "./VuuTableBrowser.css";

/** Where to load the table viewer remote from. */
export type VuuTableViewerLocation = Pick<
  RemoteModuleDescriptor,
  "mfComponent" | "mfScope" | "mfUrl"
> &
  Partial<Pick<RemoteModuleDescriptor, "clientIdentifier" | "version">>;

export interface VuuTableBrowserProps {
  /**
   * The servers to browse. Defaults to the servers published by the portal
   * registry (see `useVuuServers`).
   */
  servers?: VuuServerDescriptor[];
  /**
   * Where to load the table viewer from. Defaults to the registry module
   * whose clientIdentifier is `viewerClientIdentifier`.
   */
  viewer?: VuuTableViewerLocation;
  viewerClientIdentifier?: string;
}

interface BrowsableServer {
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

const DEFAULT_VIEWER_CLIENT_IDENTIFIER = "vuu-table-viewer";

const toBrowsableServer = ({
  connectionId,
  restUrl,
  title,
  websocketUrl,
}: VuuServerDescriptor): BrowsableServer => ({
  sourceId: connectionId,
  title,
  vuu: {
    connectionId,
    ...(restUrl === undefined ? {} : { restUrl }),
    ...(websocketUrl === undefined ? {} : { websocketUrl }),
  },
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
  onRetry,
  route,
  source,
}: {
  basePath: string;
  expanded: boolean;
  module: BrowsableServer;
  onExpandedChange: (sourceId: string, expanded: boolean) => void;
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
              <VerticalNavigationItemLabel title={module.title}>
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
          </VerticalNavigationSubMenu>
        </CollapsiblePanel>
      </Collapsible>
    </VerticalNavigationItem>
  );
};

export default function VuuTableBrowser({
  servers,
  viewer: viewerProp,
  viewerClientIdentifier = DEFAULT_VIEWER_CLIENT_IDENTIFIER,
}: VuuTableBrowserProps = {}) {
  const { modules: registeredModules } = useModuleRegistry();
  const vuuServers = useVuuServers(servers);
  const routePath = useParams()["*"];
  const { pathname } = useLocation();
  const basePath = browserBasePath(pathname, routePath);
  const route = useMemo(() => parseTableRoute(routePath), [routePath]);
  const invalidRoute = Boolean(routePath && !route);
  const [activated, setActivated] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<Record<string, SourceState>>({});

  const modules = useMemo(
    () =>
      vuuServers
        .map(toBrowsableServer)
        .sort((left, right) => left.title.localeCompare(right.title)),
    [vuuServers],
  );

  const viewer = useMemo<VuuTableViewerLocation | undefined>(() => {
    if (viewerProp) {
      return viewerProp;
    }
    const descriptor = registeredModules.find(
      ({ clientIdentifier }) => clientIdentifier === viewerClientIdentifier,
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
  }, [registeredModules, viewerClientIdentifier, viewerProp]);

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

  const registrationContext = useMemo(
    () => ({ registerTables, reportSourceStatus, unregisterTables }),
    [registerTables, reportSourceStatus, unregisterTables],
  );

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

  if (!viewer) {
    return (
      <div className="vuuTableBrowser">
        <main className="vuuTableBrowser-content">
          <div className="vuuTableBrowser-centered" role="alert">
            The Vuu table viewer is not available. Register a module with
            clientIdentifier "{viewerClientIdentifier}" or pass a viewer
            location.
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
                  onRetry={handleRetrySource}
                  route={route}
                  source={sources[module.sourceId]}
                />
              ))}
            </VerticalNavigation>
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
                      ComponentProps={{
                        selectedTable: isSelected ? selectedTable : undefined,
                        sourceId: module.sourceId,
                      }}
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
