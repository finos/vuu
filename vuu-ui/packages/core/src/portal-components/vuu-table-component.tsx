import { Button, Spinner } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  type GridComponentSettingsCodec,
  type GridSettingsCodecResult,
  type JsonValue,
  toJsonValue,
  type TypedComponentTemplate,
  useGridComponentSettingsUpdater,
} from "@vuu-ui/grid-layout";
import type {
  DataSource,
  RemoteModuleConnection,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type {
  TableConfig,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { toColumnName } from "@vuu-ui/vuu-utils";
import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AuthenticationProvider,
  useOptionalIdentityContext,
  useOptionalVuuConnectionId,
  useVuuServers,
} from "../auth/AuthenticationProvider";
import { useData } from "../context-definitions/DataProvider";
import type { WorkspaceComponentRegistration } from "../workspace/workspace-component-registry";
import {
  invalidSettings,
  isJsonValue,
  isNonEmptyString,
  isRecord,
} from "./settings-validation";
import vuuTableComponentCss from "./VuuTableComponent.css";

// Loaded lazily: @vuu-ui/vuu-table depends, indirectly, on @vuu-ui/core, so a
// static import would make core evaluate it before core itself has loaded.
const Table = lazy(() =>
  import("@vuu-ui/vuu-table").then(({ Table }) => ({ default: Table })),
);

export const VUU_TABLE_COMPONENT_TYPE = "vuu-table";

/**
 * Settings of a `vuu-table` workspace item. The table schema is not part of
 * the settings: it is fetched from the server each time the item renders.
 */
export interface VuuTableComponentSettings {
  /** The `connectionId` of the Vuu server that publishes the table. */
  readonly serverId: string;
  readonly module: string;
  readonly table: string;
  /**
   * State of this item, e.g. `{ config }`, the table's column
   * configuration. Updated as the user changes the table and persisted with
   * the GridLayout document.
   */
  readonly tableState?: JsonValue;
}

/** The shape of `tableState` written by the `vuu-table` renderer. */
export interface VuuTableState {
  config?: TableConfig;
}

export const isVuuTableComponentSettings = (
  value: unknown,
): value is VuuTableComponentSettings =>
  isRecord(value) &&
  isNonEmptyString(value.serverId) &&
  isNonEmptyString(value.module) &&
  isNonEmptyString(value.table) &&
  (value.tableState === undefined || isJsonValue(value.tableState));

const validateVuuTableSettings = (
  value: unknown,
): GridSettingsCodecResult<VuuTableComponentSettings> => {
  if (!isRecord(value)) {
    return invalidSettings("$", "vuu-table settings must be an object");
  }
  for (const key of ["serverId", "module", "table"] as const) {
    if (!isNonEmptyString(value[key])) {
      return invalidSettings(
        `$.${key}`,
        `vuu-table settings require a non-empty ${key}`,
      );
    }
  }
  if ("tableSchema" in value) {
    return invalidSettings(
      "$.tableSchema",
      "vuu-table settings must not embed a tableSchema, it is fetched from the server",
    );
  }
  if (value.tableState !== undefined && !isJsonValue(value.tableState)) {
    return invalidSettings("$.tableState", "vuu-table tableState must be JSON");
  }
  const { module, serverId, table, tableState } = value as Record<
    string,
    string
  >;
  return {
    ok: true,
    value:
      value.tableState === undefined
        ? { module, serverId, table }
        : { module, serverId, table, tableState },
  };
};

export const vuuTableSettingsCodec: GridComponentSettingsCodec<VuuTableComponentSettings> =
  {
    decode: validateVuuTableSettings,
    encode: validateVuuTableSettings,
    isSettings: isVuuTableComponentSettings,
    version: 1,
  };

/** Builds the drag/persist template for a `vuu-table` workspace item. */
export const vuuTableTemplate = ({
  label,
  module,
  serverId,
  table,
}: {
  label?: string;
  module: string;
  serverId: string;
  table: string;
}): TypedComponentTemplate => ({
  component: {
    settings: { module, serverId, table },
    type: VUU_TABLE_COMPONENT_TYPE,
    version: vuuTableSettingsCodec.version,
  },
  label: label ?? table,
});

/** Name of the DOM event dispatched when the user asks to change server. */
export const VUU_TABLE_CHANGE_SERVER_EVENT = "vuu-table-change-server";

export interface VuuTableChangeServerRequest {
  readonly componentId: string;
  readonly settings: VuuTableComponentSettings;
  /**
   * Points the item at another server, keeping `module`, `table` and
   * `tableState`. Returns false if the item's settings can't be updated.
   */
  readonly setServerId: (serverId: string) => boolean;
}

export type VuuTableChangeServerHandler = (
  request: VuuTableChangeServerRequest,
) => void;

export interface VuuTableComponentOptions {
  /**
   * Called when the user chooses Change server from the error state. The
   * request is also dispatched from the item as a bubbling
   * `vuu-table-change-server` CustomEvent, for hosts that listen in the DOM.
   */
  onChangeServer?: VuuTableChangeServerHandler;
  /**
   * Resolves a `serverId` the portal doesn't know about, e.g. a server the
   * user added manually.
   */
  resolveServer?: (serverId: string) => RemoteModuleConnection | undefined;
}

type ServerResolution =
  | { status: "current" }
  | { connection: RemoteModuleConnection; status: "connection" }
  | { status: "pending" }
  | { status: "unavailable" };

/** Resolves a `serverId` against the portal's connection management. */
export const useVuuServerConnection = (
  serverId: string,
  resolveServer?: VuuTableComponentOptions["resolveServer"],
): ServerResolution => {
  const currentConnectionId = useOptionalVuuConnectionId();
  const identity = useOptionalIdentityContext();
  const servers = useVuuServers();
  return useMemo<ServerResolution>(() => {
    if (serverId === currentConnectionId) {
      return { status: "current" };
    }
    const resolved = resolveServer?.(serverId);
    if (resolved) {
      return { connection: resolved, status: "connection" };
    }
    if (!identity) {
      return { status: "unavailable" };
    }
    if (identity.localServers) {
      return identity.localServers.has(serverId)
        ? { connection: { connectionId: serverId }, status: "connection" }
        : { status: "unavailable" };
    }
    if (identity.portalTarget.connectionId === serverId) {
      return { connection: identity.portalTarget, status: "connection" };
    }
    const server = servers.find(
      ({ connectionId }) => connectionId === serverId,
    );
    if (server) {
      const { moduleTitles: _moduleTitles, ...connection } = server;
      return { connection, status: "connection" };
    }
    return identity.moduleServerMap.settled
      ? { status: "unavailable" }
      : { status: "pending" };
  }, [currentConnectionId, identity, resolveServer, serverId, servers]);
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const classBase = "vuuTableComponent";

const VuuTableStatus = ({ children }: { children: ReactNode }) => (
  <div className={`${classBase}-status`} role="status">
    <Spinner aria-label="Loading table" size="small" />
    <span>{children}</span>
  </div>
);

interface VuuTableErrorStateProps {
  message: string;
  onChangeServer: () => void;
  onRetry: () => void;
}

const VuuTableErrorState = ({
  message,
  onChangeServer,
  onRetry,
}: VuuTableErrorStateProps) => (
  <div className={`${classBase}-error`} role="alert">
    <span className={`${classBase}-errorMessage`}>{message}</span>
    <div className={`${classBase}-errorActions`}>
      <Button onClick={onRetry}>Retry</Button>
      <Button onClick={onChangeServer}>Change server</Button>
    </div>
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
  renderError: (error: Error) => ReactNode;
}

class VuuTableErrorBoundary extends Component<
  ErrorBoundaryProps,
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[VuuTableComponent] ${error.message}`, info.componentStack);
  }

  render() {
    return this.state.error
      ? this.props.renderError(this.state.error)
      : this.props.children;
  }
}

const readTableConfig = (tableState: JsonValue | undefined) =>
  isRecord(tableState) && isRecord(tableState.config)
    ? (tableState.config as unknown as TableConfig)
    : undefined;

interface VuuTableContentProps
  extends Pick<VuuTableComponentSettings, "module" | "table" | "tableState"> {
  onConfigChange: TableConfigChangeHandler;
  renderError: (message: string) => ReactNode;
}

const VuuTableContent = ({
  module,
  onConfigChange,
  renderError,
  table,
  tableState,
}: VuuTableContentProps) => {
  const { getServerAPI, VuuDataSource } = useData();
  const [error, setError] = useState<string>();
  const [schema, setSchema] = useState<TableSchema>();

  useEffect(() => {
    let active = true;
    setError(undefined);
    setSchema(undefined);
    getServerAPI()
      .then((server) => server.getTableSchema({ module, table }))
      .then(
        (nextSchema) => {
          if (active) {
            setSchema(nextSchema);
          }
        },
        (cause: unknown) => {
          if (active) {
            setError(
              `Unable to load table ${module}:${table}: ${getErrorMessage(cause)}`,
            );
          }
        },
      );
    return () => {
      active = false;
    };
  }, [getServerAPI, module, table]);

  const dataSource = useMemo<DataSource | undefined>(
    () =>
      schema
        ? new VuuDataSource({
            columns: schema.columns.map(toColumnName),
            table: schema.table,
          })
        : undefined,
    [schema, VuuDataSource],
  );

  useEffect(
    () => () => {
      dataSource?.unsubscribe();
    },
    [dataSource],
  );

  // Read the saved config once, when the schema arrives. Later changes come
  // from the Table itself, so feeding them back would reset its state.
  const savedConfig = useRef(readTableConfig(tableState));
  const config = useMemo<TableConfig | undefined>(
    () =>
      schema ? (savedConfig.current ?? { columns: schema.columns }) : undefined,
    [schema],
  );

  if (error) {
    return renderError(error);
  }
  if (!dataSource || !config) {
    return <VuuTableStatus>Loading table...</VuuTableStatus>;
  }
  return (
    <Suspense fallback={<VuuTableStatus>Loading table...</VuuTableStatus>}>
      <Table
        className={`${classBase}-table`}
        config={config}
        dataSource={dataSource}
        onConfigChange={onConfigChange}
        renderBufferSize={20}
      />
    </Suspense>
  );
};

export interface VuuTableComponentProps
  extends VuuTableComponentSettings,
    VuuTableComponentOptions {
  componentId: string;
}

/**
 * Renders a Vuu table from `vuu-table` settings: connects to `serverId`,
 * fetches the table schema and shows the table, saving column configuration
 * in `tableState`. If the server is unavailable or the table can't be
 * loaded, shows an error with Retry and Change server.
 */
export const VuuTableComponent = ({
  componentId,
  module,
  onChangeServer,
  resolveServer,
  serverId: serverIdProp,
  table,
  tableState,
}: VuuTableComponentProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-component",
    css: vuuTableComponentCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const updateSettings = useGridComponentSettingsUpdater();

  // The item's current settings. Updates aren't fed back as props, so they
  // are tracked here, until the host renders the item with new settings.
  const propSettings = useMemo<VuuTableComponentSettings>(
    () =>
      tableState === undefined
        ? { module, serverId: serverIdProp, table }
        : { module, serverId: serverIdProp, table, tableState },
    [module, serverIdProp, table, tableState],
  );
  const settingsRef = useRef(propSettings);
  const [serverId, setServerId] = useState(serverIdProp);
  const [lastPropSettings, setLastPropSettings] = useState(propSettings);
  if (lastPropSettings !== propSettings) {
    setLastPropSettings(propSettings);
    setServerId(serverIdProp);
    settingsRef.current = propSettings;
  }

  const resolution = useVuuServerConnection(serverId, resolveServer);

  const saveSettings = useCallback(
    (settings: VuuTableComponentSettings) => {
      settingsRef.current = settings;
      return updateSettings(componentId, settings);
    },
    [componentId, updateSettings],
  );

  const handleConfigChange = useCallback<TableConfigChangeHandler>(
    (config) => {
      const state = toJsonValue({ config });
      if (state.ok) {
        saveSettings({ ...settingsRef.current, tableState: state.value });
      }
    },
    [saveSettings],
  );

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const changeServer = useCallback(() => {
    const request: VuuTableChangeServerRequest = {
      componentId,
      setServerId: (nextServerId) => {
        if (!isNonEmptyString(nextServerId)) {
          return false;
        }
        const saved = saveSettings({
          ...settingsRef.current,
          serverId: nextServerId,
        });
        setServerId(nextServerId);
        return saved;
      },
      settings: settingsRef.current,
    };
    onChangeServer?.(request);
    rootRef.current?.dispatchEvent(
      new CustomEvent<VuuTableChangeServerRequest>(
        VUU_TABLE_CHANGE_SERVER_EVENT,
        { bubbles: true, detail: request },
      ),
    );
  }, [componentId, onChangeServer, saveSettings]);

  const renderError = useCallback(
    (message: string) => (
      <VuuTableErrorState
        message={message}
        onChangeServer={changeServer}
        onRetry={retry}
      />
    ),
    [changeServer, retry],
  );

  let content: ReactNode;
  if (resolution.status === "unavailable") {
    content = renderError(`Vuu server ${serverId} is not available.`);
  } else if (resolution.status === "pending") {
    content = <VuuTableStatus>Connecting to {serverId}...</VuuTableStatus>;
  } else {
    const tableContent = (
      <VuuTableContent
        module={module}
        onConfigChange={handleConfigChange}
        renderError={renderError}
        table={table}
        tableState={settingsRef.current.tableState}
      />
    );
    content = (
      <VuuTableErrorBoundary
        renderError={(error) =>
          renderError(
            `Unable to connect to Vuu server ${serverId}: ${error.message}`,
          )
        }
      >
        {resolution.status === "connection" ? (
          <AuthenticationProvider
            connection={resolution.connection}
            mode="vuu-connection"
          >
            {tableContent}
          </AuthenticationProvider>
        ) : (
          tableContent
        )}
      </VuuTableErrorBoundary>
    );
  }

  return (
    <div
      className={classBase}
      data-server-id={serverId}
      data-table={`${module}:${table}`}
      ref={rootRef}
    >
      <div className={`${classBase}-content`} key={`${serverId}#${attempt}`}>
        {content}
      </div>
    </div>
  );
};

export const createVuuTableComponentRegistration = (
  options: VuuTableComponentOptions = {},
): WorkspaceComponentRegistration<VuuTableComponentSettings> => ({
  codec: vuuTableSettingsCodec,
  render: (settings, componentId) => (
    <VuuTableComponent {...settings} {...options} componentId={componentId} />
  ),
  type: VUU_TABLE_COMPONENT_TYPE,
});
