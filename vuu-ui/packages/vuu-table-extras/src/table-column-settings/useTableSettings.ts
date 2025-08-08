import { SchemaColumn } from "@vuu-ui/vuu-data-types";
import { updateTableConfig } from "@vuu-ui/vuu-table";
import {
  ColumnDescriptor,
  TableConfig,
  TableSettingsProps,
} from "@vuu-ui/vuu-table-types";
import {
  addColumnToSubscribedColumns,
  queryClosest,
  isCalculatedColumn,
  subscribedOnly,
  useLayoutEffectSkipFirst,
  CommitHandler,
  reorderColumnItems,
} from "@vuu-ui/vuu-utils";
import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnChangeHandler } from "../column-list";
import { ColumnItem } from "../column-list/useColumnList";

export type ColumnLike = {
  name: string;
};

const buildColumnItems = (
  availableColumns: Array<SchemaColumn & { label?: string }>,
  configuredColumns: ColumnDescriptor[],
): ColumnItem[] => {
  return availableColumns.map<ColumnItem>(
    ({ name, label = name, serverDataType }) => {
      const configuredColumn = configuredColumns.find(
        (col) => col.name === name,
      );
      return {
        hidden: configuredColumn?.hidden,
        isCalculated: isCalculatedColumn(name),
        label: configuredColumn?.label ?? label,
        name,
        serverDataType,
        subscribed: configuredColumn !== undefined,
      };
    },
  );
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
    [availableColumns, tableConfig.columns],
  );

  const handleReorderColumnItems = useCallback(
    (columnItems: ColumnItem[]) => {
      const orderedNames = columnItems.map((c) => c.name);
      setColumnState((state) => {
        const newAvailableColumns = reorderColumnItems(
          state.availableColumns,
          orderedNames,
        );
        const newColumns = reorderColumnItems(
          tableConfig.columns,
          orderedNames,
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
    [tableConfig.columns],
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
                subscribedOnly(subscribedColumns),
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
              name,
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
    [availableColumns, columnItems, onDataSourceConfigChange, tableConfig],
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
        setColumnState((state) => ({
          ...state,
          tableConfig: {
            ...state.tableConfig,
            [value]: ariaPressed !== "true",
          },
        }));
      }
    },
    [],
  );

  const handleCommitColumnWidth = useCallback<CommitHandler>((_, value) => {
    if (typeof value === "string") {
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
    }
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
    onReorderColumnItems: handleReorderColumnItems,
    tableConfig,
  };
};
