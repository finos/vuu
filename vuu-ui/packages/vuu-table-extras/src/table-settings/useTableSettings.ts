import { SchemaColumn } from "@finos/vuu-data-types";
import { updateTableConfig } from "@finos/vuu-table";
import {
  ColumnDescriptor,
  TableConfig,
  TableSettingsProps,
} from "@finos/vuu-table-types";
import {
  addColumnToSubscribedColumns,
  queryClosest,
  isCalculatedColumn,
  moveItem,
  subscribedOnly,
  useLayoutEffectSkipFirst,
} from "@finos/vuu-utils";
import { Commithandler } from "@finos/vuu-ui-controls/src";
import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnChangeHandler } from "../column-list";

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
  isCalculated: boolean;
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
      isCalculated: isCalculatedColumn(name),
      label: configuredColumn?.label,
      name,
      serverDataType,
      subscribed: configuredColumn !== undefined,
    };
  });
};

type ColumnState = {
  availableColumns: SchemaColumn[];
  tableConfig: TableConfig;
};

export const useTableSettings = ({
  availableColumns: availableColumnsProp,
  onConfigChange,
  onDataSourceConfigChange,
  tableConfig: tableConfigProp,
}: Omit<TableSettingsProps, "onAddCalculatedColumn">) => {
  const [{ availableColumns, tableConfig }, setColumnState] =
    useState<ColumnState>({
      availableColumns: availableColumnsProp,
      tableConfig: tableConfigProp,
    });

  const columnItems = useMemo(
    () => buildColumnItems(availableColumns, tableConfig.columns),
    [availableColumns, tableConfig.columns]
  );

  const handleMoveListItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      setColumnState((state) => {
        const newAvailableColumns = moveItem(
          state.availableColumns,
          fromIndex,
          toIndex
        );
        const newColumns = sortOrderFromAvailableColumns(
          newAvailableColumns,
          tableConfig.columns
        );

        return {
          availableColumns: newAvailableColumns,
          tableConfig: {
            ...state.tableConfig,
            columns: newColumns,
          },
        };
      });
    },
    [tableConfig.columns]
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
          setColumnState((state) => ({
            ...state,
            tableConfig: {
              ...tableConfig,
              columns: tableConfig.columns.filter(
                subscribedOnly(subscribedColumns)
              ),
            },
          }));
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
          setColumnState((state) => ({
            ...state,
            tableConfig: newConfig,
          }));

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
          setColumnState((state) => ({
            ...state,
            tableConfig: newConfig,
          }));
        }
      }
    },
    [availableColumns, columnItems, onDataSourceConfigChange, tableConfig]
  );

  const handleChangeColumnLabels = useCallback((evt: SyntheticEvent) => {
    const button = queryClosest<HTMLButtonElement>(evt.target, "button");
    if (button) {
      const value = parseInt(button.value);
      const columnFormatHeader =
        value === 0 ? undefined : value === 1 ? "capitalize" : "uppercase";
      setColumnState((state) => ({
        ...state,
        tableConfig: {
          ...state.tableConfig,
          columnFormatHeader,
        },
      }));
    }
  }, []);

  const handleChangeTableAttribute = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      const button = queryClosest<HTMLButtonElement>(evt.target, "button");
      if (button) {
        const { ariaPressed, value } = button;
        console.log({ ariaPressed, value, button });
        setColumnState((state) => ({
          ...state,
          tableConfig: {
            ...state.tableConfig,
            [value]: ariaPressed !== "true",
          },
        }));
      }
    },
    []
  );

  const handleCommitColumnWidth = useCallback<Commithandler>((_, value) => {
    const columnDefaultWidth = parseInt(value);
    if (!isNaN(columnDefaultWidth)) {
      setColumnState((state) => ({
        ...state,
        tableConfig: {
          ...state.tableConfig,
          columnDefaultWidth,
        },
      }));
    }
    console.log({ value });
  }, []);

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
    onCommitColumnWidth: handleCommitColumnWidth,
    onMoveListItem: handleMoveListItem,
    tableConfig,
  };
};
