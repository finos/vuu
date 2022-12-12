import { useContextMenu } from "@vuu-ui/ui-controls";
import cx from "classnames";
import React, { HTMLAttributes, useCallback, useEffect, useRef } from "react";
import { GroupColumnDescriptor, KeyedColumnDescriptor } from "../grid-model";
import { expandStatesfromGroupState } from "../grid-model/gridModelUtils";
import { ColResizer } from "./ColResizer";
import { HeaderCellProps } from "./HeaderCell";
import { useCellResize } from "./useCellResize";

import "./GroupHeaderCell.css";

const classBase = "hwGroupHeaderCell";

export interface ColHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  column: KeyedColumnDescriptor;
  expandState: 0 | 1 | -1;
  onClick: (column: KeyedColumnDescriptor) => void;
  onRemoveColumn: (column: KeyedColumnDescriptor) => void;
  onToggle: (column: KeyedColumnDescriptor, expandState: number) => void;
}
const ColHeader = (props: ColHeaderProps) => {
  const { column, className, onClick, onRemoveColumn, expandState, onToggle } =
    props;
  const expanded = expandState === 1;
  return (
    <div
      className={cx(`${classBase}-col`, className, {
        expanded,
        collapsed: !expanded,
      })}
      role="columnheader"
    >
      <span
        className="hwIconContainer"
        data-icon={expanded ? "arrow-down" : "arrow-right"}
        onClick={() => onToggle(column, -expandState)}
      />

      <span className={`${classBase}-label`} onClick={() => onClick(column)}>
        {column.name}
      </span>
      <span
        className="hwIconContainer remove-group-column"
        data-icon="close-circle"
        onClick={() => onRemoveColumn(column)}
      />
    </div>
  );
};

export interface GroupHeaderCellProps
  extends Omit<HeaderCellProps, "onClick" | "onDrag"> {
  column: GroupColumnDescriptor;
  groupState?: any;
  onClick: (
    groupCol: GroupColumnDescriptor,
    column: KeyedColumnDescriptor
  ) => void;
  onRemoveColumn: (column: KeyedColumnDescriptor) => void;
  onToggleGroupState: () => void;
}

export const GroupHeaderCell = ({
  className: classNameProp,
  column: groupCol,
  groupState = {},
  onClick,
  onRemoveColumn,
  onResize,
  onToggleGroupState,
}: GroupHeaderCellProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const column = useRef(groupCol);

  useEffect(() => {
    column.current = groupCol;
  }, [groupCol]);

  const { isResizing, ...resizeProps } = useCellResize({
    column: groupCol,
    onResize,
    rootRef,
  });

  const handleClick = useCallback(
    (column: KeyedColumnDescriptor) => {
      onClick(groupCol, column);
    },
    [groupCol, onClick]
  );

  const showContextMenu = useContextMenu();
  const handleContextMenu = (e: React.MouseEvent) => {
    showContextMenu(e, "header", { column });
  };

  const { columns, resizing, width } = groupCol;
  const className = cx("hwHeaderCell", classBase, classNameProp, {
    [`${classBase}-resizing`]: resizing,
  });
  const expandStates = expandStatesfromGroupState(groupCol, groupState);
  return (
    <div
      ref={rootRef}
      className={className}
      style={{ paddingLeft: 0, width: width }}
      onContextMenu={handleContextMenu}
    >
      <div className={`${classBase}-inner-container`}>
        {columns.map((column, idx) => (
          <ColHeader
            key={column.key}
            column={column}
            expandState={expandStates[idx]}
            onClick={handleClick}
            onRemoveColumn={onRemoveColumn}
            onToggle={onToggleGroupState}
          />
        ))}
      </div>
      <ColResizer {...resizeProps} />
    </div>
  );
};
