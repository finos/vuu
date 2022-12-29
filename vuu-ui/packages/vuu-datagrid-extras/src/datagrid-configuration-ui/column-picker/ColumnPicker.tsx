import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { List } from "@heswell/salt-lab";
import { Button, Text, useIdMemo as useId } from "@salt-ds/core";
import { Dispatch, HTMLAttributes, useCallback, useState } from "react";
import { ColumnAction } from "../settings-panel/useColumns";

import "./ColumnPicker.css";

const classBase = "vuuColumnPicker";
const removeSelectedColumns = (
  availableColumns: ColumnDescriptor[],
  selectedColumns: ColumnDescriptor[]
) => {
  return availableColumns.filter(
    (column) => selectedColumns.find((col) => col.name === column.name) == null
  );
};

export interface ColumnPickerProps extends HTMLAttributes<HTMLDivElement> {
  availableColumns: ColumnDescriptor[];
  dispatchColumnAction: Dispatch<ColumnAction>;
  onSelectionChange?: (selected: ColumnDescriptor | null) => void;
  chosenColumns: ColumnDescriptor[];
  selectedColumn: ColumnDescriptor | null;
}

export const ColumnPicker = ({
  availableColumns,
  id: idProp,
  dispatchColumnAction: dispatch,
  onSelectionChange,
  chosenColumns: selectedColumns,
  selectedColumn,
}: ColumnPickerProps) => {
  const [selected1, setSelected1] = useState<ColumnDescriptor[]>([]);
  const id = useId(idProp);

  const unusedColumns = removeSelectedColumns(
    availableColumns,
    selectedColumns
  );

  const addColumn = useCallback(() => {
    if (selected1.length > 0) {
      setSelected1([]);
      dispatch({ type: "addColumn", columns: selected1 });
    }
  }, [dispatch, selected1]);

  const removeColumn = useCallback(
    () =>
      selectedColumn &&
      dispatch({ type: "removeColumn", column: selectedColumn }),

    [selectedColumn, dispatch]
  );

  const moveColumnUp = useCallback(
    () =>
      selectedColumn &&
      dispatch({ type: "moveColumn", column: selectedColumn, moveBy: -1 }),
    [dispatch, selectedColumn]
  );
  const moveColumnDown = useCallback(
    () =>
      selectedColumn &&
      dispatch({ type: "moveColumn", column: selectedColumn, moveBy: 1 }),
    [dispatch, selectedColumn]
  );

  const handleSelectionChange1 = useCallback(
    (evt, selected) => setSelected1(selected),
    []
  );

  const handleSelectionChange2 = useCallback(
    (evt, selected: ColumnDescriptor | null) => onSelectionChange?.(selected),
    [onSelectionChange]
  );

  return (
    <div className={classBase} id={id}>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`available-${id}`}>
          <Text as="h4">Available Columns</Text>
        </label>
        <div className={`${classBase}-listContainer`} style={{ flex: 1 }}>
          <List<ColumnDescriptor, "extended">
            borderless
            checkable={false}
            id={`available-${id}`}
            itemHeight={24}
            itemToString={(item) => item.name}
            onSelectionChange={handleSelectionChange1}
            selected={selected1}
            selectionStrategy="extended"
            source={unusedColumns}
          />
        </div>
        <div
          style={{ display: "flex", alignItems: "center", flex: "0 0 32px" }}
        >
          <Button onClick={addColumn} disabled={selected1.length === 0}>
            Add
            <span data-icon="arrow-thin-right" style={{ marginLeft: 8 }} />
          </Button>
        </div>
      </div>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`selected-${id}`}>
          <Text as="h4">Chosen Columns</Text>
        </label>
        <div className={`${classBase}-listContainer`} style={{ flex: 1 }}>
          <List<ColumnDescriptor>
            borderless
            id={`selected-${id}`}
            itemHeight={24}
            itemToString={(item) => item.name}
            onSelectionChange={handleSelectionChange2}
            selected={selectedColumn}
            style={{ flex: 1 }}
            source={selectedColumns}
          />
        </div>
        <div
          style={{
            alignItems: "center",
            flex: "0 0 32px",
            display: "flex",
            gap: 6,
          }}
        >
          <Button onClick={removeColumn} disabled={selectedColumn === null}>
            <span data-icon="arrow-thin-left" style={{ marginRight: 8 }} />
            Remove
          </Button>
          <Button
            aria-label="Move column up"
            onClick={moveColumnUp}
            disabled={
              selectedColumn === null ||
              selectedColumns?.indexOf(selectedColumn) === 0
            }
            style={{ width: 28 }}
          >
            <span data-icon="arrow-thin-up" />
          </Button>
          <Button
            aria-label="Move column down"
            onClick={moveColumnDown}
            disabled={
              selectedColumn === null ||
              selectedColumns.indexOf(selectedColumn) ===
                selectedColumns.length - 1
            }
            style={{ width: 28 }}
          >
            <span data-icon="arrow-thin-down" />
          </Button>
        </div>
      </div>
    </div>
  );
};
