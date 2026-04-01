import { DataSourceConfig } from "@vuu-ui/vuu-data-types";
import {
  ColumnMenuPermissions,
  SettingsPermissions,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
// import { getCalculatedColumnDetails } from "@vuu-ui/vuu-utils";
import { useCallback, useRef } from "react";
import { DisplayColumnSettingsAction } from "@vuu-ui/vuu-table-extras/src/column-menu/column-action-types";
import { useContextPanel } from "@vuu-ui/vuu-ui-controls";
import { defaultTableSettingsPermissions } from "../table-settings-panel/TableSettingsPanel";

export interface TableAndColumnSettingsHookProps {
  // onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
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
  tableConfig,
}: TableAndColumnSettingsHookProps) => {
  const showTableSettingsRef = useRef<() => void>(undefined);

  const showContextPanel = useContextPanel();

  const handleCancelCreateColumn = useCallback(() => {
    requestAnimationFrame(() => {
      showTableSettingsRef.current?.();
    });
  }, []);

  // const handleCreateCalculatedColumn = useCallback(
  //   (column: ColumnDescriptor) => {
  //     const { serverDataType } = getCalculatedColumnDetails(column);
  //     if (serverDataType) {
  //       const newAvailableColumns = availableColumns.concat({
  //         name: column.name,
  //         serverDataType,
  //       });
  //       setAvailableColumns(newAvailableColumns);
  //       onAvailableColumnsChange?.(newAvailableColumns);
  //       requestAnimationFrame(() => {
  //         showTableSettingsRef.current?.();
  //       });
  //       onCreateCalculatedColumn(column);
  //     } else {
  //       throw Error(
  //         "Cannot create calculatec columns without valis serverDataType",
  //       );
  //     }
  //   },
  //   [availableColumns, onAvailableColumnsChange, onCreateCalculatedColumn],
  // );

  const showColumnSettingsPanel = useCallback(
    (action: DisplayColumnSettingsAction) => {
      // showContextPanel("ColumnSettings", "Column Settings", {
      //   column: action.column,
      //   onCancelCreateColumn: handleCancelCreateColumn,
      //   onConfigChange,
      //   // onCreateCalculatedColumn: handleCreateCalculatedColumn,
      //   tableConfig,
      //   vuuTable: action.vuuTable,
      // } as ColumnSettingsProps);
    },
    [
      handleCancelCreateColumn,
      // handleCreateCalculatedColumn,
      showContextPanel,
      tableConfig,
    ],
  );

  // const handleAddCalculatedColumn = useCallback(() => {
  //   showColumnSettingsPanel({
  //     column: {
  //       name: "::",
  //       serverDataType: "string",
  //     },
  //     type: "column-settings",
  //     vuuTable: { module: "SIMUL", table: "instruments" },
  //   });
  // }, [showColumnSettingsPanel]);

  // const handleNavigateToColumn = useCallback(
  //   (columnName: string) => {
  //     const column = tableConfig.columns.find((c) => c.name === columnName);
  //     if (column) {
  //       showColumnSettingsPanel({
  //         type: "column-settings",
  //         column,
  //         //TODO where do we get this from
  //         vuuTable: { module: "SIMUL", table: "instruments" },
  //       });
  //     }
  //   },
  //   [showColumnSettingsPanel, tableConfig.columns],
  // );

  return {
    showColumnSettingsPanel,
  };
};
