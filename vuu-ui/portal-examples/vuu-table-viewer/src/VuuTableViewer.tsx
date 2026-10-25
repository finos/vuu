import { Button, Spinner } from "@salt-ds/core";
import { AuthenticationProvider, useData } from "@vuu-ui/core";
import {
  type JsonValue,
  useRetryConnection,
  useVuuServerConnection,
} from "@vuu-ui/core/portal";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import type { FilterHandler, FilterState } from "@vuu-ui/vuu-filter-types";
import type { FilterBarProps } from "@vuu-ui/vuu-filters";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import "./VuuTableViewer.css";

const classBase = "vuuTableViewer";

export interface VuuTableViewerProps {
  module?: string;
  /** The table's state changed, e.g. its columns. Save it as `tableState`. */
  onTableStateChange?: (tableState: JsonValue) => void;
  /**
   * The Vuu server of the table. Default: the module's own connection.
   * Resolved by the portal's connection management.
   */
  serverId?: string;
  table?: string;
  /** Table state saved from `onTableStateChange`. */
  tableState?: JsonValue;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readTableConfig = (tableState: JsonValue | undefined) =>
  isRecord(tableState) && isRecord(tableState.config)
    ? (tableState.config as unknown as TableConfig)
    : undefined;

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
};

/**
 * The table of a viewer route, `<serverId>/<module>/<table>`, relative to the
 * viewer's own path.
 */
export const parseViewerRoute = (
  route: string | undefined,
): { module: string; serverId: string; table: string } | undefined => {
  const segments = route?.replace(/\/$/, "").split("/").map(decodeSegment);
  if (segments?.length !== 3 || segments.some((segment) => !segment)) {
    return undefined;
  }
  const [serverId, module, table] = segments as string[];
  return { module, serverId, table };
};

const Status = ({ children }: { children: string }) => (
  <div className={`${classBase}-status`} role="status">
    <Spinner aria-label={children} size="small" />
    <span>{children}</span>
  </div>
);

interface SelectedTableProps {
  onTableStateChange?: (tableState: JsonValue) => void;
  table: VuuTable;
  tableState?: JsonValue;
}

const SelectedTable = ({
  onTableStateChange,
  table,
  tableState,
}: SelectedTableProps) => {
  const { getServerAPI, VuuDataSource } = useData();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string>();
  const [schema, setSchema] = useState<TableSchema>();
  const { module, table: tableName } = table;

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally retries schema loading.
  useEffect(() => {
    let active = true;
    setError(undefined);
    setSchema(undefined);

    getServerAPI()
      .then((server) => server.getTableSchema({ module, table: tableName }))
      .then(
        (nextSchema) => {
          if (active) {
            setSchema(nextSchema);
          }
        },
        (cause: unknown) => {
          if (active) {
            setError(getErrorMessage(cause));
          }
        },
      );

    return () => {
      active = false;
    };
  }, [attempt, getServerAPI, module, tableName]);

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

  const [filterState, setFilterState] = useState<FilterState>({
    activeIndices: [],
    filters: [],
  });
  const handleApplyFilter = useCallback<FilterHandler>(
    (filter) => dataSource?.setFilter?.(filter),
    [dataSource],
  );
  const handleClearFilter = useCallback(
    () => dataSource?.clearFilter?.(),
    [dataSource],
  );

  // Read the saved config once: later changes come from the Table itself.
  const savedConfig = useRef(readTableConfig(tableState));
  const tableConfig = useMemo<TableConfig | undefined>(
    () =>
      schema ? (savedConfig.current ?? { columns: schema.columns }) : undefined,
    [schema],
  );
  const handleConfigChange = useCallback(
    (config: TableConfig) =>
      onTableStateChange?.({ config } as unknown as JsonValue),
    [onTableStateChange],
  );

  if (error) {
    return (
      <div className={`${classBase}-status`} role="alert">
        <span>
          Unable to load table {module}:{tableName}: {error}
        </span>
        <Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
      </div>
    );
  }

  if (!schema || !dataSource || !tableConfig) {
    return <Status>Loading table...</Status>;
  }

  const filterBarProps: Partial<FilterBarProps> = {
    columnDescriptors: schema.columns,
    filterState,
    onApplyFilter: handleApplyFilter,
    onClearFilter: handleClearFilter,
    onFilterStateChanged: setFilterState,
    vuuTable: schema.table,
  };

  return (
    <FilterTable
      FilterBarProps={filterBarProps}
      TableProps={{
        config: tableConfig,
        dataSource,
        onConfigChange: onTableStateChange ? handleConfigChange : undefined,
        renderBufferSize: 20,
      }}
      style={{ height: "100%" }}
    />
  );
};

const ServerUnavailable = ({ serverId }: { serverId: string }) => {
  const retryConnection = useRetryConnection();
  return (
    <div className={`${classBase}-status`} role="alert">
      <span>The Vuu server {serverId} is not available.</span>
      <Button onClick={() => retryConnection(serverId)}>Retry</Button>
    </div>
  );
};

const ServerTable = ({
  serverId,
  ...props
}: SelectedTableProps & { serverId: string }) => {
  const resolution = useVuuServerConnection(serverId);
  const selectedTable = <SelectedTable {...props} />;
  switch (resolution.status) {
    case "current":
      return selectedTable;
    case "connection":
      return (
        <AuthenticationProvider
          connection={resolution.connection}
          mode="vuu-connection"
        >
          {selectedTable}
        </AuthenticationProvider>
      );
    case "pending":
      return <Status>{`Connecting to ${serverId}...`}</Status>;
    default:
      return <ServerUnavailable serverId={serverId} />;
  }
};

/**
 * Shows one Vuu table, given by props: `serverId`, `module` and `table`.
 * Without them, reads the table from its route,
 * `<serverId>/<module>/<table>`. Each instance keeps its own state, so many
 * viewers, even of the same table, can coexist.
 */
export default function VuuTableViewer({
  module,
  onTableStateChange,
  serverId,
  table,
  tableState,
}: VuuTableViewerProps) {
  const route = parseViewerRoute(useParams()["*"]);
  const vuuTable =
    module && table ? { module, table } : route ? route : undefined;
  const server = module && table ? serverId : route?.serverId;

  if (!vuuTable) {
    return (
      <div className={`${classBase}-status`} role="status">
        No table selected. Open tables from Tables › Browse.
      </div>
    );
  }

  const props: SelectedTableProps = {
    onTableStateChange,
    table: { module: vuuTable.module, table: vuuTable.table },
    tableState,
  };
  const key = `${server ?? ""}:${vuuTable.module}:${vuuTable.table}`;
  return server ? (
    <ServerTable {...props} key={key} serverId={server} />
  ) : (
    <SelectedTable {...props} key={key} />
  );
}
