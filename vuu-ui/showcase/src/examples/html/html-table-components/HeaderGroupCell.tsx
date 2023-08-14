import { MouseEvent, useCallback } from "react";
import { useContextMenu } from "@finos/vuu-popups";
import { useCell } from "./useCell";
import { SortIndicator } from "@finos/vuu-table/src/table/SortIndicator";
import { HeaderCellProps } from "./HeaderCell";
import {
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import cx from "classnames";

export interface ColHeaderProps {
  classBase: string;
  column: KeyedColumnDescriptor;
}

const RemoveButton = ({ classBase, column }: ColHeaderProps) => {
  return (
    <span
      className={`${classBase}-close`}
      data-column-name={column.name}
      data-icon="close"
    />
  );
};

const ColHeader = (props: ColHeaderProps) => {
  const { column, classBase } = props;
  return (
    <div className={cx(`${classBase}-col`)} role="columnheader">
      <span className={`${classBase}-label`}>{column.name}</span>
      <RemoveButton classBase={classBase} column={column} />
    </div>
  );
};

export const HeaderGroupCell = ({
  classBase: classBaseProp,
  column,
  onClick,
  idx,
}: HeaderCellProps) => {
  const [showContextMenu] = useContextMenu();
  const handleContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      showContextMenu(e, "header", { column });
    },
    [column, showContextMenu]
  );

  const isResizing = false;
  const classBase = `${classBaseProp}-col-group-header`;

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => !isResizing && onClick?.(evt),
    [isResizing, onClick]
  );

  const { className, style } = useCell(column, classBase, true);
  const { columns } = column as GroupColumnDescriptor;

  return (
    <div
      className={className}
      data-idx={idx}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="cell"
      style={style}
    >
      <div className={`${classBase}-inner`}>
        {columns.map((column) => (
          <ColHeader classBase={classBase} key={column.key} column={column} />
        ))}
      </div>
      <SortIndicator sorted={column.sorted} />
    </div>
  );
};
