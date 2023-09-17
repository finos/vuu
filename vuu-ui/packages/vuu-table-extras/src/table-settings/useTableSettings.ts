import { SchemaColumn } from "@finos/vuu-data";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import { updateTableConfig } from "@finos/vuu-table";
import {
  addColumnToSubscribedColumns,
  moveItem,
  subscribedOnly,
} from "@finos/vuu-utils";
import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnChangeHandler } from "../column-list";
import { TableSettingsProps } from "./TableSettingsPanel";

const sortOrderFromAvailableColumns = (
  availableColumns: SchemaColumn[],
  columns: ColumnDescriptor[]
) => {
  const sortedColumns: ColumnDescriptor[] = [];
  for (const { name } of availableColumns) {
    const column = columns.find((col) => col.name === name);
    if (column) {
      sortedColumns.push(column);
    }
  }
  return sortedColumns;
};

export type ColumnItem = Pick<
  ColumnDescriptor,
  "hidden" | "label" | "name" | "serverDataType"
> & {
  subscribed: boolean;
};

const buildColumnItems = (
  availableColumns: SchemaColumn[],
  configuredColumns: ColumnDescriptor[]
): ColumnItem[] => {
  return availableColumns.map<ColumnItem>(({ name, serverDataType }) => {
    const configuredColumn = configuredColumns.find((col) => col.name === name);
    return {
      hidden: configuredColumn?.hidden,
      label: configuredColumn?.label,
      name,
      serverDataType,
      subscribed: configuredColumn !== undefined,
    };
  });
};

export const useTableSettings = ({
  availableColumns: availableColumnsProp,
  onConfigChange,
  onDataSourceConfigChange,
  tableConfig: tableConfigProp,
}: TableSettingsProps) => {
  const [availableColumns, setAvailableColumns] =
    useState<SchemaColumn[]>(availableColumnsProp);
  const [tableConfig, setTableConfig] = useState<TableConfig>(tableConfigProp);

  const columnItems = useMemo(
    () => buildColumnItems(availableColumns, tableConfig.columns),
    [availableColumns, tableConfig.columns]
  );

  const handleMoveListItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      setAvailableColumns((columns) => {
        const newAvailableColumns = moveItem(columns, fromIndex, toIndex);
        const newColumns = sortOrderFromAvailableColumns(
          newAvailableColumns,
          tableConfig.columns
        );
        console.log({ newColumns });
        // TODO fire a move column action
        return newAvailableColumns;
      });
    },
    []
  );

  const handleColumnChange = useCallback<ColumnChangeHandler>(
    (name, property, value) => {
      // to be applied immediately
      const columnItem = columnItems.find((col) => col.name === name);
      if (property === "subscribed") {
        if (columnItem?.subscribed) {
          const subscribedColumns = tableConfig.columns
            .filter((col) => col.name !== name)
            .map((col) => col.name);
          setTableConfig({
            ...tableConfig,
            columns: tableConfig.columns.filter(
              subscribedOnly(subscribedColumns)
            ),
          });
          onDataSourceConfigChange({
            columns: subscribedColumns,
          });
        } else {
          const newConfig = {
            ...tableConfig,
            columns: addColumnToSubscribedColumns(
              tableConfig.columns,
              availableColumns,
              name
            ),
          };
          setTableConfig(newConfig);

          const subscribedColumns = newConfig.columns.map((col) => col.name);

          onDataSourceConfigChange({
            columns: subscribedColumns,
          });
        }
      } else if (columnItem?.subscribed) {
        const column = tableConfig.columns.find((col) => col.name === name);
        if (column) {
          const newConfig = updateTableConfig(tableConfig, {
            type: "column-prop",
            property,
            column,
            value,
          });
          setTableConfig(newConfig);
        }
      }
    },
    [availableColumns, columnItems, onDataSourceConfigChange, tableConfig]
  );

  const handleChangeColumnLabels = useCallback((evt: SyntheticEvent) => {
    const { value } = evt.target as HTMLFormElement;
    const columnFormatHeader =
      value === "0" ? undefined : value === "1" ? "capitalize" : "uppercase";
    setTableConfig((config) => ({
      ...config,
      columnFormatHeader,
    }));
  }, []);

  const handleChangeTableAttribute = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      const { ariaChecked, value } = evt.target as HTMLInputElement;
      setTableConfig((config) => ({
        ...config,
        [value]: ariaChecked !== "true",
      }));
    },
    []
  );

  useLayoutEffectSkipFirst(() => {
    onConfigChange?.(tableConfig);
  }, [onConfigChange, tableConfig]);

  const columnLabelsValue =
    tableConfig.columnFormatHeader === undefined
      ? 0
      : tableConfig.columnFormatHeader === "capitalize"
      ? 1
      : 2;

  return {
    columnItems,
    columnLabelsValue,
    onChangeColumnLabels: handleChangeColumnLabels,
    onChangeTableAttribute: handleChangeTableAttribute,
    onColumnChange: handleColumnChange,
    onMoveListItem: handleMoveListItem,
    tableConfig,
  };
};
