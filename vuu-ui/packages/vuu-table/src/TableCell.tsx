import { TableCellProps } from "@finos/vuu-datagrid-types";
import { getColumnPinStyle, metadataKeys } from "@finos/vuu-utils";
import { EditableLabel } from "@heswell/salt-lab";
import cx from "classnames";
import { KeyboardEvent, memo, useCallback, useRef, useState } from "react";

import "./TableCell.css";

const { KEY } = metadataKeys;

export const TableCell = memo(
  ({ className: classNameProp, column, onClick, row }: TableCellProps) => {
    const labelFieldRef = useRef<HTMLDivElement>(null);
    const {
      align,
      CellRenderer,
      key,
      pin,
      editable,
      resizing,
      valueFormatter,
    } = column;
    const [editing, setEditing] = useState<boolean>(false);
    const value = valueFormatter(row[key]);
    const [editableValue, setEditableValue] = useState<string>(value);
    const handleTitleMouseDown = () => {
      labelFieldRef.current?.focus();
    };
    const handleTitleKeyDown = (evt: KeyboardEvent<HTMLTableCellElement>) => {
      if (evt.key === "Enter") {
        setEditing(true);
      }
    };

    const handleClick = useCallback(() => {
      onClick?.(column);
    }, [column, onClick]);

    const handleEnterEditMode = () => {
      setEditing(true);
    };

    const handleExitEditMode = (
      originalValue = "",
      finalValue = "",
      allowDeactivation = true,
      editCancelled = false
    ) => {
      setEditing(false);
      if (editCancelled) {
        setEditableValue(originalValue);
      } else if (finalValue !== originalValue) {
        setEditableValue(finalValue);
      }
      if (allowDeactivation === false) {
        labelFieldRef.current?.focus();
      }
    };

    // might want to useMemo here, this won't change often
    const className =
      cx(classNameProp, {
        vuuAlignRight: align === "right",
        vuuPinFloating: pin === "floating",
        vuuPinLeft: pin === "left",
        vuuPinRight: pin === "right",
        "vuuTableCell-resizing": resizing,
      }) || undefined;
    const pinnedStyle = getColumnPinStyle(column);
    return editable ? (
      <td
        className={className}
        data-editable
        style={pinnedStyle}
        onKeyDown={handleTitleKeyDown}
      >
        <EditableLabel
          editing={editing}
          key="title"
          value={editableValue}
          onChange={setEditableValue}
          onMouseDownCapture={handleTitleMouseDown}
          onEnterEditMode={handleEnterEditMode}
          onExitEditMode={handleExitEditMode}
          onKeyDown={handleTitleKeyDown}
          ref={labelFieldRef}
          tabIndex={0}
        />
      </td>
    ) : (
      <td className={className} style={pinnedStyle} onClick={handleClick}>
        {CellRenderer ? <CellRenderer column={column} row={row} /> : value}
      </td>
    );
  },
  cellValuesAreEqual
);
TableCell.displayName = "TableCell";

function cellValuesAreEqual(prev: TableCellProps, next: TableCellProps) {
  return (
    prev.column === next.column &&
    prev.onClick === next.onClick &&
    prev.row[KEY] === next.row[KEY] &&
    prev.row[prev.column.key] === next.row[next.column.key]
  );
}
