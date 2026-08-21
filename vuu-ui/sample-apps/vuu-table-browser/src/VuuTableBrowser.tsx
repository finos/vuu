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
  normalizeVuuAuthTarget,
  TableRegistrationContext,
  type TableSourceStatus,
  useIdentityToken,
  usePortalVuuAuthTarget,
} from "@vuu-ui/core";
import { RemoteModule, type RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { getRegisteredModules } from "@vuu-ui/vuu-shell";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useResolvedPath,
} from "react-router-dom";

import "./VuuTableBrowser.css";

export interface VuuTableBrowserProps {
  moduleRegistryUrl: string;
}

interface RegistryModule extends RemoteModuleDescriptor {
  moduleRegistryUrl?: string;
}

interface BrowsableModule extends RegistryModule {
  sourceId: string;
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

const viewerRemote = {
  mfComponent: "VuuTableViewer",
  mfScope: "vuuTableViewer",
  mfUrl: "http://localhost:5010",
};

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

const sameTable = (left: VuuTable, right: VuuTable) =>
  left.module === right.module && left.table === right.table;

const SourceNavigation = ({
  expanded,
  module,
  onExpandedChange,
  onRetry,
  route,
  source,
}: {
  expanded: boolean;
  module: BrowsableModule;
  onExpandedChange: (sourceId: string, expanded: boolean) => void;
  onRetry: (sourceId: string) => void;
  route?: TableRoute;
  source?: SourceState;
}) => {
  const location = useLocation();
  const browserRoute = useResolvedPath(".");
  const browserRoutePath = browserRoute.pathname.replace(/\/$/, "");
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
                        pathname: `${browserRoutePath}/${path}`,
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

export default function VuuTableBrowser() {
  const getIdentityToken = useIdentityToken();
  const portalTarget = usePortalVuuAuthTarget();
  const routePath = useParams()["*"];
  const route = useMemo(() => parseTableRoute(routePath), [routePath]);
  const invalidRoute = Boolean(routePath && !route);
  const [activated, setActivated] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [modules, setModules] = useState<BrowsableModule[]>();
  const [registryError, setRegistryError] = useState<string>();
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<Record<string, SourceState>>({});

  const moduleRegistryUrl = "https://localhost:8444/module-registry";

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadAttempt intentionally retriggers discovery.
  useEffect(() => {
    let active = true;
    setModules(undefined);
    setRegistryError(undefined);

    const loadModules = async () => {
      try {
        const identityToken = await getIdentityToken();
        const { modules: registeredModules } = await getRegisteredModules(
          moduleRegistryUrl,
          identityToken,
        );

        if (!active) {
          return;
        }
        if (!Array.isArray(registeredModules)) {
          throw Error("The module registry response has no modules array");
        }

        const sourceIds = new Set<string>();
        const nextModules = registeredModules
          .flatMap((module: RegistryModule) => {
            if (!module.vuu) {
              return [];
            }

            try {
              normalizeVuuAuthTarget(module.vuu, portalTarget);
            } catch {
              return [];
            }

            const sourceId = String(module.id ?? module.name);
            if (sourceIds.has(sourceId)) {
              return [];
            }
            sourceIds.add(sourceId);
            return [{ ...module, sourceId, vuu: module.vuu }];
          })
          .sort((left, right) => left.title.localeCompare(right.title));
        setModules(nextModules);
      } catch (cause: unknown) {
        if (active) {
          setRegistryError(
            cause instanceof Error ? cause.message : String(cause),
          );
        }
      }
    };

    loadModules();

    return () => {
      active = false;
    };
  }, [getIdentityToken, loadAttempt, moduleRegistryUrl, portalTarget]);

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

  if (registryError) {
    return (
      <div className="vuuTableBrowser-centered" role="alert">
        <span>Unable to load the module registry: {registryError}</span>
        <Button onClick={() => setLoadAttempt((value) => value + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!modules) {
    return (
      <div className="vuuTableBrowser-centered" role="status">
        <Spinner aria-label="Loading Vuu servers" />
        <span>Loading Vuu servers...</span>
      </div>
    );
  }

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
                      {...viewerRemote}
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
