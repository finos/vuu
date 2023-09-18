import { DataSourceConfig, SchemaColumn } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
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
              onConfigChange,
              tableConfig,
            },
          },
          column: action.column,
          tableConfig,
          title: "Column Settings",
        },
      } as SetPropsAction);
    },
    [dispatchLayoutAction, onConfigChange, tableConfig]
  );

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
    onConfigChange,
    onDataSourceConfigChange,
    tableConfig,
  ]);

  return {
    showColumnSettingsPanel,
    showTableSettingsPanel,
  };
};
