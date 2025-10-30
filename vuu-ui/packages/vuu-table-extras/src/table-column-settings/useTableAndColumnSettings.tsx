import { DataSourceConfig, SchemaColumn } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  ColumnMenuPermissions,
  ColumnSettingsProps,
  SettingsPermissions,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import { getCalculatedColumnDetails } from "@vuu-ui/vuu-utils";
import { useCallback, useRef, useState } from "react";
import { DisplayColumnSettingsAction } from "@vuu-ui/vuu-table-extras/src/column-menu/column-action-types";
import { useContextPanel } from "@vuu-ui/vuu-ui-controls";
import {
  defaultTableSettingsPermissions,
  TableSettingsPanel,
} from "./TableSettingsPanel";

export interface TableAndColumnSettingsHookProps {
  availableColumns: SchemaColumn[];
  onAvailableColumnsChange?: (columns: SchemaColumn[]) => void;
  onConfigChange: (config: TableConfig) => void;
  onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
  onDataSourceConfigChange: (dataSourceConfig: DataSourceConfig) => void;
  settingsPermissions?: SettingsPermissions;
  tableConfig: TableConfig;
}

export const columnSettingsFromColumnMenuPermissions = (
  settings?: boolean | ColumnMenuPermissions,
) =>
  typeof settings === undefined
    ? true
    : typeof settings === "boolean"
      ? settings
      : (settings?.allowColumnSettings ?? true);
export const tableSettingsFromColumnMenuPermissions = (
  settings?: boolean | ColumnMenuPermissions,
) =>
  typeof settings === undefined
    ? defaultTableSettingsPermissions
    : typeof settings === "boolean"
      ? settings
      : (settings?.allowTableSettings ?? defaultTableSettingsPermissions);

export const useTableAndColumnSettings = ({
  availableColumns: availableColumnsProps,
  settingsPermissions,
  onAvailableColumnsChange,
  onConfigChange,
  onCreateCalculatedColumn,
  onDataSourceConfigChange,
  tableConfig,
}: TableAndColumnSettingsHookProps) => {
  const showTableSettingsRef = useRef<() => void>(undefined);

  const [availableColumns, setAvailableColumns] = useState<SchemaColumn[]>(
    availableColumnsProps,
  );

  const showContextPanel = useContextPanel();

  const handleCancelCreateColumn = useCallback(() => {
    requestAnimationFrame(() => {
      showTableSettingsRef.current?.();
    });
  }, []);

  const handleCreateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      const { serverDataType } = getCalculatedColumnDetails(column);
      if (serverDataType) {
        const newAvailableColumns = availableColumns.concat({
          name: column.name,
          serverDataType,
        });
        setAvailableColumns(newAvailableColumns);
        onAvailableColumnsChange?.(newAvailableColumns);
        requestAnimationFrame(() => {
          showTableSettingsRef.current?.();
        });
        onCreateCalculatedColumn(column);
      } else {
        throw Error(
          "Cannot create calculatec columns without valis serverDataType",
        );
      }
    },
    [availableColumns, onAvailableColumnsChange, onCreateCalculatedColumn],
  );

  const showColumnSettingsPanel = useCallback(
    (action: DisplayColumnSettingsAction) => {
      showContextPanel("ColumnSettings", "Column Settings", {
        column: action.column,
        onCancelCreateColumn: handleCancelCreateColumn,
        onConfigChange,
        onCreateCalculatedColumn: handleCreateCalculatedColumn,
        tableConfig,
        vuuTable: action.vuuTable,
      } as ColumnSettingsProps);
    },
    [
      handleCancelCreateColumn,
      handleCreateCalculatedColumn,
      onConfigChange,
      showContextPanel,
      tableConfig,
    ],
  );

  const handleAddCalculatedColumn = useCallback(() => {
    showColumnSettingsPanel({
      column: {
        name: "::",
        serverDataType: "string",
      },
      type: "column-settings",
      vuuTable: { module: "SIMUL", table: "instruments" },
    });
  }, [showColumnSettingsPanel]);

  const handleNavigateToColumn = useCallback(
    (columnName: string) => {
      const column = tableConfig.columns.find((c) => c.name === columnName);
      if (column) {
        showColumnSettingsPanel({
          type: "column-settings",
          column,
          //TODO where do we get this from
          vuuTable: { module: "SIMUL", table: "instruments" },
        });
      }
    },
    [showColumnSettingsPanel, tableConfig.columns],
  );

  showTableSettingsRef.current = useCallback(() => {
    const tableSettings = (
      <TableSettingsPanel
        availableColumns={
          availableColumns ??
          tableConfig.columns.map(({ name, serverDataType }) => ({
            name,
            serverDataType,
          }))
        }
        onAddCalculatedColumn={handleAddCalculatedColumn}
        onConfigChange={onConfigChange}
        onDataSourceConfigChange={onDataSourceConfigChange}
        onNavigateToColumn={handleNavigateToColumn}
        permissions={settingsPermissions?.allowTableSettings}
        tableConfig={tableConfig}
      />
    );
    showContextPanel(tableSettings, "Table Settings");
  }, [
    availableColumns,
    handleAddCalculatedColumn,
    handleNavigateToColumn,
    onConfigChange,
    onDataSourceConfigChange,
    settingsPermissions,
    showContextPanel,
    tableConfig,
  ]);

  return {
    showColumnSettingsPanel,
    showTableSettingsPanel: showTableSettingsRef.current,
  };
};
