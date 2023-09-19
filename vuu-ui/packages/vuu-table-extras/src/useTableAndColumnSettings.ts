import { DataSourceConfig, SchemaColumn } from "@finos/vuu-data";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { SetPropsAction, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { TableSettingsProps } from "@finos/vuu-table-extras";
import { useCallback } from "react";
import { ColumnActionColumnSettings } from "@finos/vuu-table/src/table-next/useTableModel";

export interface TableAndColumnSettingsHookProps {
  availableColumns: SchemaColumn[];
  onConfigChange: (config: TableConfig) => void;
  onDataSourceConfigChange: (dataSourceConfig: DataSourceConfig) => void;
  tableConfig: TableConfig;
}
export const useTableAndColumnSettings = ({
  availableColumns,
  onConfigChange,
  onDataSourceConfigChange,
  tableConfig,
}: TableAndColumnSettingsHookProps) => {
  const dispatchLayoutAction = useLayoutProviderDispatch();

  const handleCreateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      console.log(`create column`, {
        column,
      });
    },
    []
  );

  const showColumnSettingsPanel = useCallback(
    (action: ColumnActionColumnSettings) => {
      dispatchLayoutAction({
        type: "set-props",
        path: "#context-panel",
        props: {
          expanded: true,
          content: {
            type: "ColumnSettings",
            props: {
              columnName: action.column.name,
              isNewCalculatedColumn:
                action.column.isCalculated && action.column.name === "",
              onConfigChange,
              onCreateCalculatedColumn: handleCreateCalculatedColumn,
              tableConfig,
              vuuTable: action.vuuTable,
            },
          },
          title: "Column Settings",
        },
      } as SetPropsAction);
    },
    [
      dispatchLayoutAction,
      handleCreateCalculatedColumn,
      onConfigChange,
      tableConfig,
    ]
  );

  const handleAddCalculatedColumn = useCallback(() => {
    showColumnSettingsPanel({
      column: {
        name: "",
        isCalculated: true,
      },
      type: "columnSettings",
      vuuTable: { module: "SIMUL", table: "instruments" },
    });
  }, [showColumnSettingsPanel]);

  const showTableSettingsPanel = useCallback(() => {
    dispatchLayoutAction({
      type: "set-props",
      path: "#context-panel",
      props: {
        expanded: true,
        content: {
          type: "TableSettings",
          props: {
            availableColumns:
              availableColumns ??
              tableConfig.columns.map(({ name, serverDataType }) => ({
                name,
                serverDataType,
              })),
            onAddCalculatedColumn: handleAddCalculatedColumn,
            onConfigChange,
            onDataSourceConfigChange,
            tableConfig,
          } as TableSettingsProps,
        },
        title: "DataGrid Settings",
      },
    } as SetPropsAction);
  }, [
    availableColumns,
    dispatchLayoutAction,
    handleAddCalculatedColumn,
    onConfigChange,
    onDataSourceConfigChange,
    tableConfig,
  ]);

  return {
    showColumnSettingsPanel,
    showTableSettingsPanel,
  };
};
