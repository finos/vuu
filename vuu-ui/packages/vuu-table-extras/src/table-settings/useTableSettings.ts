import { SchemaColumn } from "@finos/vuu-data-types";
import { updateTableConfig } from "@finos/vuu-table";
import {
  ColumnDescriptor,
  DateTimeTableAttributes,
  TableConfig,
  TableSettingsProps,
} from "@finos/vuu-table-types";
import {
  addColumnToSubscribedColumns,
  isCalculatedColumn,
  moveItem,
  subscribedOnly,
  useLayoutEffectSkipFirst,
} from "@finos/vuu-utils";
import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnChangeHandler } from "../column-list";
import { SingleSelectionHandler } from "@finos/vuu-ui-controls";

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
    const { value } = evt.target as HTMLFormElement;
    const columnFormatHeader =
      value === "0" ? undefined : value === "1" ? "capitalize" : "uppercase";
    setColumnState((state) => ({
      ...state,
      tableConfig: {
        ...state.tableConfig,
        columnFormatHeader,
      },
    }));
  }, []);

  const handleChangeTableAttribute = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      const { ariaChecked, value } = evt.target as HTMLInputElement;
      setColumnState((state) => ({
        ...state,
        tableConfig: {
          ...state.tableConfig,
          [value]: ariaChecked !== "true",
        },
      }));
    },
    []
  );

  const handleChangeDateTimeAttribute = useCallback<
    <T extends keyof DateTimeTableAttributes>(
      key: T
    ) => SingleSelectionHandler<DateTimeTableAttributes[T]>
  >(
    (key) => (_, value) => {
      setColumnState((s) => ({
        ...s,
        tableConfig: {
          ...s.tableConfig,
          dateTime: { ...s.tableConfig.dateTime, [key]: value },
        },
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
    onChangeDateTimeAttribute: handleChangeDateTimeAttribute,
    onMoveListItem: handleMoveListItem,
    tableConfig,
  };
};
