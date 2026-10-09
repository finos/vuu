import { Button, Spinner } from "@salt-ds/core";
import {
  TableRegistrationContext,
  useData,
  useOptionalVuuConnectionId,
} from "@vuu-ui/core";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import type { FilterHandler, FilterState } from "@vuu-ui/vuu-filter-types";
import type { FilterBarProps } from "@vuu-ui/vuu-filters";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import "./VuuTableViewer.css";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const SelectedTable = ({ table }: { table: VuuTable }) => {
  const { getServerAPI, VuuDataSource } = useData();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string>();
  const [schema, setSchema] = useState<TableSchema>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally retries schema loading.
  const { module, table: tableName } = table;
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

  if (error) {
    return (
      <div className="vuuTableViewer-status" role="alert">
        <span>Unable to load the selected table: {error}</span>
        <Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
      </div>
    );
  }

  if (!schema || !dataSource) {
    return (
      <div className="vuuTableViewer-status" role="status">
        <Spinner aria-label="Loading table" />
        <span>Loading table...</span>
      </div>
    );
  }

  const tableConfig: TableConfig = { columns: schema.columns };
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
        renderBufferSize: 20,
      }}
      style={{ height: "100%" }}
    />
  );
};

/**
 * Publishes the tables of its Vuu connection to the table browser and shows
 * the browser's selected table when it belongs to that connection. The
 * browser renders one viewer per server, each with its own `vuu` connection.
 */
export default function VuuTableViewer() {
  const { getServerAPI } = useData();
  const registration = useContext(TableRegistrationContext);
  const sourceId = useOptionalVuuConnectionId();
  const selectedTable =
    registration?.selectedTable &&
    registration.selectedTable.sourceId === sourceId
      ? registration.selectedTable.table
      : undefined;

  // Depend on the registration callbacks, not the context value: the value
  // changes whenever the selected table changes, and re-running this effect
  // would unregister the tables and deselect the table, looping forever.
  const registerTables = registration?.registerTables;
  const reportSourceStatus = registration?.reportSourceStatus;
  const unregisterTables = registration?.unregisterTables;

  useEffect(() => {
    if (
      !registerTables ||
      !reportSourceStatus ||
      !unregisterTables ||
      sourceId === undefined
    ) {
      return;
    }
    let active = true;
    reportSourceStatus(sourceId, "loading");

    getServerAPI()
      .then((server) => server.getTableList())
      .then(
        ({ tables }) => {
          if (active) {
            registerTables(sourceId, tables);
            reportSourceStatus(sourceId, "ready");
          }
        },
        (cause: unknown) => {
          if (active) {
            reportSourceStatus(sourceId, "error", getErrorMessage(cause));
          }
        },
      );

    return () => {
      active = false;
      unregisterTables(sourceId);
    };
  }, [
    getServerAPI,
    registerTables,
    reportSourceStatus,
    sourceId,
    unregisterTables,
  ]);

  if (selectedTable) {
    return (
      <SelectedTable
        key={`${selectedTable.module}:${selectedTable.table}`}
        table={selectedTable}
      />
    );
  }

  return registration ? null : (
    <div className="vuuTableViewer-status" role="status">
      Select a table in the Vuu Table Browser.
    </div>
  );
}
