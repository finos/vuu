import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { EditableLabel } from "@heswell/salt-lab";
import cx from "classnames";
import { HTMLAttributes, KeyboardEvent, useRef, useState } from "react";
import { ValueFormatter } from "./dataTableTypes";

import "./TableCell.css";

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  row: DataSourceRow;
  valueFormatter?: ValueFormatter;
}

const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

export const TableCell = ({
  className: classNameProp,
  column,
  row,
  valueFormatter = defaultValueFormatter,
}: TableCellProps) => {
  const labelFieldRef = useRef<HTMLDivElement>(null);
  const { align, key, pin, editable, pinnedLeftOffset, resizing } = column;
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
      // onEditTitle?.(finalValue);
    }
    if (allowDeactivation === false) {
      labelFieldRef.current?.focus();
    }
  };

  // might want to useMemo here, this won't change often
  const className =
    cx(classNameProp, {
      vuuAlignRight: align === "right",
      vuuPinLeft: pin === "left",
      "vuuTableCell-resizing": resizing,
    }) || undefined;
  const pinnedStyle = pin === "left" ? { left: pinnedLeftOffset } : undefined;
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
    <td className={className} style={pinnedStyle}>
      {value}
    </td>
  );
};
