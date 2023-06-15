import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent, useCallback, useRef } from "react";
import { useContextMenu } from "@finos/vuu-popups";
import { useCell } from "./table-next/useCell";
import { SortIndicator } from "@finos/vuu-table/src/SortIndicator";
import {
  ColumnResizer,
  TableColumnResizeHandler,
  useTableColumnResize,
} from "@finos/vuu-table";

export interface HeaderCellProps extends HTMLAttributes<HTMLDivElement> {
  classBase?: string;
  column: KeyedColumnDescriptor;
  idx: number;
  onResize?: TableColumnResizeHandler;
}

export const HeaderCell = ({
  classBase: classBaseProp,
  column,
  onClick,
  onResize,
  idx,
}: HeaderCellProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const showContextMenu = useContextMenu();
  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      showContextMenu(e, "header", { column });
    },
    [column, showContextMenu]
  );

  const classBase = `${classBaseProp}-col-header`;

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => !isResizing && onClick?.(evt),
    [isResizing, onClick]
  );

  const { className, style } = useCell(column, classBase, true);

  return (
    <div
      className={className}
      data-idx={idx}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      ref={rootRef}
      role="cell"
      style={style}
    >
      <div className={`${classBase}-label`}>{column.name}</div>
      <SortIndicator sorted={column.sorted} />
      {column.resizeable !== false ? <ColumnResizer {...resizeProps} /> : null}
    </div>
  );
};
