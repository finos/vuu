import {
  ColumnModel,
  ColumnsChangeHandler,
  TableDisplayAttributeChangeHandler,
} from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { TableProps } from "../Table";
import type {
  ColumnDescriptor,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { DataSource } from "@vuu-ui/vuu-data-types";

export interface TableConfigHookProps extends Pick<TableProps, "config"> {
  availableColumns: readonly ColumnDescriptor[];
  dataSource: DataSource;
  onTableConfigChange?: TableConfigChangeHandler;
}

export const useTableConfig = ({
  availableColumns,
  config: initialTableConfig,
  dataSource,
  onTableConfigChange,
}: TableConfigHookProps) => {
  const [tableConfig, setTableConfig] =
    useState<TableConfig>(initialTableConfig);

  const handleColumnModelChange = useCallback<ColumnsChangeHandler>(
    (columns, changeSource, changeDescriptor) => {
      if (
        changeSource === "column-picker" ||
        changeSource === "column-settings"
      ) {
        if (
          changeDescriptor?.type === "calculated-column-added" ||
          changeDescriptor?.type === "column-added"
        ) {
          dataSource.columns = dataSource.columns.concat(
            changeDescriptor.column.name,
          );
        } else if (changeDescriptor?.type === "column-removed") {
          dataSource.columns = dataSource.columns.filter(
            (name) => name !== changeDescriptor.column.name,
          );
        }

        let newConfig: TableConfig | undefined = undefined;
        setTableConfig((config) => (newConfig = { ...config, columns }));
        if (
          changeDescriptor?.type === "column-removed" ||
          changeDescriptor?.type === "column-added" ||
          changeDescriptor?.type === "calculated-column-added"
        ) {
          if (newConfig) {
            // calling onTableConfigChange will allow client to persist changes
            // for future sessions
            onTableConfigChange?.(newConfig, changeDescriptor);
          }
        }
      }
    },
    [dataSource, onTableConfigChange],
  );

  const columnModel = useMemo(() => {
    const model = new ColumnModel(availableColumns, tableConfig.columns);
    model.on("change", handleColumnModelChange);
    return model;
  }, [availableColumns, handleColumnModelChange, tableConfig.columns]);

  const handleTableConfigChange = useCallback<TableConfigChangeHandler>(
    (_config, changeType) => {
      if (changeType.type === "column-removed") {
        columnModel.removeItemFromSelectedColumns(
          changeType.column.name,
          "table",
        );
      }
    },
    [columnModel],
  );

  const handleTableDisplayAttributeChange =
    useCallback<TableDisplayAttributeChangeHandler>((displayAttributes) => {
      setTableConfig((config) => ({
        ...config,
        ...displayAttributes,
      }));
    }, []);

  return {
    columnModel,
    onTableDisplayAttributeChange: handleTableDisplayAttributeChange,
    onTableConfigChange: handleTableConfigChange,
    tableConfig,
  };
};
