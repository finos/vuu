import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent, useCallback } from "react";
import { useContextMenu } from "@finos/vuu-popups";
import { useCell } from "./table-next/useCell";

export interface HeaderCellProps extends HTMLAttributes<HTMLDivElement> {
  classBase?: string;
  column: KeyedColumnDescriptor;
  idx: number;
}

export const HeaderCell = ({
  classBase,
  column,
  onClick,
  idx,
}: HeaderCellProps) => {
  const showContextMenu = useContextMenu();
  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      showContextMenu(e, "header", { column });
    },
    [column, showContextMenu]
  );

  const isResizing = false;

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => !isResizing && onClick?.(evt),
    [isResizing, onClick]
  );

  const { className, style } = useCell(column, `${classBase}-col-header`, true);

  return (
    <div
      className={className}
      data-idx={idx}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="cell"
      style={style}
    >
      {column.name}
    </div>
  );
};
