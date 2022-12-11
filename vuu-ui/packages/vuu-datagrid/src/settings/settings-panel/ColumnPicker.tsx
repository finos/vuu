import { List } from "@heswell/salt-lab";
import { Button, Text, useIdMemo as useId } from "@salt-ds/core";
import { HTMLAttributes, SyntheticEvent, useCallback, useState } from "react";
import { KeyedColumnDescriptor } from "../../grid-model";
import "./ColumnPicker.css";

const classBase = "vuuColumnPicker";
const removeSelectedColumns = (
  availableColumns: KeyedColumnDescriptor[],
  selectedColumns: KeyedColumnDescriptor[]
) => {
  return availableColumns.filter(
    (column) => selectedColumns.find((col) => col.name === column.name) == null
  );
};

export interface ColumnPickerProps extends HTMLAttributes<HTMLDivElement> {
  availableColumns: KeyedColumnDescriptor[];
  onSelectionChange?: (
    evt: SyntheticEvent,
    selected: KeyedColumnDescriptor
  ) => void;
  selectedColumns: KeyedColumnDescriptor[];
}

export const ColumnPicker = ({
  availableColumns,
  id: idProp,
  onSelectionChange,
  selectedColumns: selectedColumnsProp,
}: ColumnPickerProps) => {
  const [selectedColumns, setSelectedColumns] =
    useState<KeyedColumnDescriptor[]>(selectedColumnsProp);
  const [selected1, setSelected1] = useState<KeyedColumnDescriptor | null>(
    null
  );
  const [selected2, setSelected2] = useState<KeyedColumnDescriptor | null>(
    null
  );
  const id = useId(idProp);

  const unusedColumns = removeSelectedColumns(
    availableColumns,
    selectedColumns
  );

  const addColumn = useCallback(() => {
    if (selected1) {
      const newColumn = { ...selected1 };
      setSelected1(null);
      setSelectedColumns((columns) => columns.concat(newColumn));
    }
  }, [selected1]);

  const removeColumn = useCallback(() => {
    if (selected2) {
      const { name } = selected2;
      setSelected2(null);
      setSelectedColumns((columns) =>
        columns.filter((col) => col.name !== name)
      );
    }
  }, [selected2]);

  const moveColumnUp = useCallback(() => {
    if (selected2) {
      const idx = selectedColumns.indexOf(selected2);
      const newColumns = selectedColumns.slice();
      const [movedColumns] = newColumns.splice(idx, 1);
      newColumns.splice(idx - 1, 0, movedColumns);
      setSelectedColumns(newColumns);
    }
  }, [selected2, selectedColumns]);
  const moveColumnDown = useCallback(() => {
    if (selected2) {
      const idx = selectedColumns.indexOf(selected2);
      const newColumns = selectedColumns.slice();
      const [movedColumns] = newColumns.splice(idx, 1);
      newColumns.splice(idx + 1, 0, movedColumns);
      setSelectedColumns(newColumns);
    }
  }, [selected2, selectedColumns]);

  const handleSelectionChange1 = useCallback((evt, selected) => {
    setSelected1(selected);
  }, []);
  const handleSelectionChange2 = useCallback(
    (evt, selected) => {
      setSelected2(selected);
      onSelectionChange?.(evt, selected);
    },
    [onSelectionChange]
  );

  return (
    <div className={classBase} id={id}>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`available-${id}`}>
          <Text as="h4">Available Columns</Text>
        </label>
        <div className={`${classBase}-listContainer`} style={{ flex: 1 }}>
          <List<KeyedColumnDescriptor>
            borderless
            id={`available-${id}`}
            itemHeight={24}
            itemToString={(item) => item.name}
            onSelectionChange={handleSelectionChange1}
            selected={selected1}
            source={unusedColumns}
          />
        </div>
        <div
          style={{ display: "flex", alignItems: "center", flex: "0 0 32px" }}
        >
          <Button onClick={addColumn} disabled={selected1 === null}>
            Add
          </Button>
        </div>
      </div>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`selected-${id}`}>
          <Text as="h4">Selected Columns</Text>
        </label>
        <div className={`${classBase}-listContainer`} style={{ flex: 1 }}>
          <List<KeyedColumnDescriptor>
            borderless
            id={`selected-${id}`}
            itemHeight={24}
            itemToString={(item) => item.name}
            onSelectionChange={handleSelectionChange2}
            selected={selected2}
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
          <Button onClick={removeColumn} disabled={selected2 === null}>
            Remove
          </Button>
          <Button
            onClick={moveColumnUp}
            disabled={
              selected2 === null || selectedColumns.indexOf(selected2) === 0
            }
          >
            Up
          </Button>
          <Button
            onClick={moveColumnDown}
            disabled={
              selected2 === null ||
              selectedColumns.indexOf(selected2) === selectedColumns.length - 1
            }
          >
            Down
          </Button>
        </div>
      </div>
    </div>
  );
};
