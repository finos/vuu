import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent, useCallback } from "react";
import { useContextMenu } from "@finos/vuu-popups";

export interface HeaderCellProps extends HTMLAttributes<HTMLDivElement> {
  classBase?: string;
  column: KeyedColumnDescriptor;
}

export const HeaderCell = ({ classBase, column }: HeaderCellProps) => {
  const showContextMenu = useContextMenu();
  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      showContextMenu(e, "header", { column });
    },
    [column, showContextMenu]
  );

  return (
    <div
      className={`${classBase}-col-header`}
      onContextMenu={handleContextMenu}
      role="cell"
      style={{ width: column.width }}
    >
      {column.name}
    </div>
  );
};
