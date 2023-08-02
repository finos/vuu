import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { GridModelAction, TableColumnResizeHandler } from "@finos/vuu-table";
import { updateColumn } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";

export interface ColumnResizeHookProps {
  columns: KeyedColumnDescriptor[];
  dispatchColumnAction: (action: GridModelAction) => void;
  onConfigChange: (
    propName: string,
    colName: string,
    propValue: unknown
  ) => void;
}

export const useColumnResize = ({
  columns: modelColumns,
  dispatchColumnAction,
  onConfigChange,
}: ColumnResizeHookProps) => {
  const [stateColumns, setStateColumns] = useState<
    KeyedColumnDescriptor[] | undefined
  >(undefined);
  const [columns, setColumnSize] = useMemo(() => {
    const setSize = (columnName: string, width: number) => {
      const cols = updateColumn(modelColumns, columnName, { width });
      setStateColumns(cols);
    };
    return [stateColumns ?? modelColumns, setSize];
  }, [modelColumns, stateColumns]);

  const onHeaderResize: TableColumnResizeHandler = useCallback(
    (phase, columnName, width) => {
      const column = columns.find((column) => column.name === columnName);
      if (column) {
        if (phase === "resize") {
          setColumnSize(columnName, width as number);
        } else {
          if (phase === "end") {
            onConfigChange?.("col-size", column.name, width);
          }
          setStateColumns(undefined);
          dispatchColumnAction({
            type: "resizeColumn",
            phase,
            column,
            width,
          });
        }
      } else {
        throw Error(
          `useDataTable.handleColumnResize, column ${columnName} not found`
        );
      }
    },
    [columns, dispatchColumnAction, onConfigChange, setColumnSize]
  );

  return {
    columns,
    onHeaderResize,
  };
};
