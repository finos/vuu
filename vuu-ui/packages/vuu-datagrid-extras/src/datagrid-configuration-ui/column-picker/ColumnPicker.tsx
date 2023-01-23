import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { List, Tooltip, useTooltip } from "@heswell/salt-lab";
import { Button, Text, useIdMemo as useId } from "@salt-ds/core";
import { Dispatch, HTMLAttributes, useCallback, useState } from "react";
import { ColumnAction } from "../settings-panel/useGridSettings";

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
  onAddCalculatedColumnClick: () => void;
  onSelectionChange?: (selected: ColumnDescriptor | null) => void;
  chosenColumns: ColumnDescriptor[];
  selectedColumn: ColumnDescriptor | null;
}

export const ColumnPicker = ({
  availableColumns,
  id: idProp,
  dispatchColumnAction: dispatch,
  onAddCalculatedColumnClick,
  onSelectionChange,
  chosenColumns,
  selectedColumn,
}: ColumnPickerProps) => {
  const [selected1, setSelected1] = useState<ColumnDescriptor[]>([]);
  const id = useId(idProp);

  const unusedColumns = removeSelectedColumns(availableColumns, chosenColumns);

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

  const handleDrop = useCallback(
    (moveFrom: number, moveTo: number) => {
      dispatch({ type: "moveColumn", moveFrom, moveTo });
    },
    [dispatch]
  );

  const { getTriggerProps, getTooltipProps } = useTooltip();

  const addColumnTooltipProps = getTooltipProps({
    title: "Add Calculated Column",
  });

  return (
    <div className={classBase} id={id}>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`available-${id}`}>
          <Text as="h4">Hidden Columns</Text>
        </label>
        <div
          className={`${classBase}-listContainer`}
          style={{ flex: 1, overflow: "hidden" }}
        >
          <List<ColumnDescriptor, "extended">
            borderless
            checkable={false}
            height="100%"
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
          style={{
            display: "flex",
            alignItems: "center",
            flex: "0 0 32px",
            marginTop: "var(--salt-size-basis-unit)",
          }}
        >
          <Button onClick={addColumn} disabled={selected1.length === 0}>
            Show
            <span data-icon="arrow-thin-right" style={{ marginLeft: 8 }} />
          </Button>
        </div>
      </div>
      <div className={`${classBase}-listColumn`}>
        <label htmlFor={`selected-${id}`}>
          <Text as="h4">Visible Columns</Text>
        </label>
        <div
          className={`${classBase}-listContainer`}
          style={{ flex: 1, overflow: "hidden" }}
        >
          <List<ColumnDescriptor>
            allowDragDrop
            borderless
            height="100%"
            id={`selected-${id}`}
            itemHeight={24}
            itemToString={(item) => item.name}
            onMoveListItem={handleDrop}
            onSelectionChange={handleSelectionChange2}
            selected={selectedColumn}
            style={{ flex: 1 }}
            source={chosenColumns}
          />
        </div>
        <div
          style={{
            alignItems: "center",
            flex: "0 0 32px",
            display: "flex",
            gap: 6,
            marginTop: "var(--salt-size-basis-unit)",
          }}
        >
          <Button onClick={removeColumn} disabled={selectedColumn === null}>
            <span data-icon="arrow-thin-left" style={{ marginRight: 8 }} />
            Hide
          </Button>
          <Button
            aria-label="Move column up"
            onClick={moveColumnUp}
            disabled={
              selectedColumn === null ||
              chosenColumns?.indexOf(selectedColumn) === 0
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
              chosenColumns.indexOf(selectedColumn) === chosenColumns.length - 1
            }
            style={{ width: 28 }}
          >
            <span data-icon="arrow-thin-down" />
          </Button>
          <Button
            {...getTriggerProps<typeof Button>()}
            aria-label="Add calculated column"
            className={`${classBase}-addCalculatedColumn`}
            onClick={onAddCalculatedColumnClick}
            variant="primary"
          >
            <span data-icon="add" />
          </Button>
          <Tooltip {...addColumnTooltipProps} />
        </div>
      </div>
    </div>
  );
};
