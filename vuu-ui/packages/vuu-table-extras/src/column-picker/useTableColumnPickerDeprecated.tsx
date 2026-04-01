import type { DataSource } from "@vuu-ui/vuu-data-types";
import {
  ColumnChangeSource,
  ColumnModel,
  ColumnPicker,
  ColumnsChangeHandler,
  isColumnAdded,
  isColumnRemoved,
  isColumnsReordered,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnDescriptor,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { useContextPanel, useHideContextPanel } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TableColumnChangeHandler = (
  columns: ColumnDescriptor[],
  change: unknown,
) => void;

export interface ColumnPickerHookProps {
  readonly availableColumns: ColumnDescriptor[];
  dataSource: DataSource;
  readonly selectedColumns: ColumnDescriptor[];
  onTableColumnChange?: TableColumnChangeHandler;
}

export const useTableColumnPickerDeprecated = ({
  availableColumns,
  dataSource,
  onTableColumnChange,
  selectedColumns: initialSelectedColumns,
}: ColumnPickerHookProps) => {
  const showContextPanel = useContextPanel();
  const hideContextPanel = useHideContextPanel();
  const contextPanelShowing = useRef(false);
  const [selectedColumns, setSelectedColumns] = useState<ColumnDescriptor[]>(
    initialSelectedColumns,
  );

  const columnModel = useMemo(() => {
    const available = availableColumns;
    const selected = initialSelectedColumns;
    return new ColumnModel(available, selected);
  }, [initialSelectedColumns, availableColumns]);

  // This is provided as a 'configChange' handler to Table. It is invoked
  // when changes are applied from within the table, eg removing a column
  // from the column menu. We do not emit a config change for these -
  // client is responsible for tracking table-sourced changed.
  const handleTableConfigChange = useCallback<TableConfigChangeHandler>(
    (_config, configChangeType) => {
      if (configChangeType?.type === "column-removed") {
        columnModel.removeItemFromSelectedColumns(
          configChangeType.column.name,
          ColumnChangeSource.Table,
        );

        const idx = dataSource.columns.findIndex(
          (col) => col === configChangeType?.column.name,
        );
        if (idx >= 0) {
          dataSource.columns = dataSource.columns.toSpliced(idx, 1);
        }

        setSelectedColumns((columns) => {
          return columns.filter(
            (col) => col.name !== configChangeType.column.name,
          );
        });
      }
    },
    [columnModel, dataSource],
  );

  const handleChangeTableColumns = useCallback<ColumnsChangeHandler>(
    (columns, changeSource, changeDescriptor) => {
      if (changeSource === ColumnChangeSource.ColumnPicker) {
        if (isColumnAdded(changeDescriptor)) {
          dataSource.columns = dataSource.columns.concat(
            changeDescriptor.column.name,
          );
        }
        if (isColumnRemoved(changeDescriptor)) {
          const idx = dataSource.columns.findIndex(
            (col) => col === changeDescriptor?.column.name,
          );
          if (idx >= 0) {
            dataSource.columns = dataSource.columns.toSpliced(idx, 1);
          }
        }

        setSelectedColumns((columns) => {
          const getNewColumns = () => {
            if (isColumnAdded(changeDescriptor)) {
              return columns.concat(changeDescriptor.column);
            }
            if (isColumnRemoved(changeDescriptor)) {
              return columns.filter(
                (col) => col.name !== changeDescriptor.column.name,
              );
            }
            if (isColumnsReordered(changeDescriptor)) {
              const unMatched = columns.filter(
                (configColumn) =>
                  !columns.some((col) => col.name === configColumn.name),
              );

              return [...columns, ...unMatched];
            }
            return columns;
          };

          const newColumns = getNewColumns();
          onTableColumnChange?.(newColumns, changeDescriptor);
          return newColumns;
        });
      }
    },
    [dataSource, onTableColumnChange],
  );

  useEffect(() => {
    columnModel.on("change", handleChangeTableColumns);
    return () => {
      columnModel.removeListener("change", handleChangeTableColumns);
    };
  }, [columnModel, handleChangeTableColumns]);

  const showColumnPicker = useCallback(
    (title = "Column Picker") => {
      contextPanelShowing.current = true;
      showContextPanel(<ColumnPicker columnModel={columnModel} />, title);
    },
    [columnModel, showContextPanel],
  );

  useEffect(
    () => () => {
      if (contextPanelShowing.current) {
        // It might already be closed, but this won't do any harm
        hideContextPanel?.();
      }
    },
    [hideContextPanel],
  );

  return {
    onTableConfigChange: handleTableConfigChange,
    showColumnPicker,
    selectedColumns,
  };
};
