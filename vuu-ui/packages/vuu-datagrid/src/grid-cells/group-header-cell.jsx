import React, { useRef, useEffect, useCallback } from "react";
import cx from "classnames";
import { useContextMenu } from "@finos/ui-controls";
import Draggable from "../draggable";
import { expandStatesfromGroupState } from "../grid-model/grid-model-utils";

import "./group-header-cell.css";

const classBase = "hwGroupHeaderCell";

const ColHeader = (props) => {
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

export const GroupHeaderCell = ({
  className: classNameProp,
  column: groupCol,
  groupState = {},
  onClick,
  onRemoveColumn,
  onResize,
  onToggleGroupState,
}) => {
  const el = useRef(null);
  const column = useRef(groupCol);

  useEffect(() => {
    column.current = groupCol;
  }, [groupCol]);

  const handleClick = (column) => {
    onClick(groupCol, column);
  };

  // All duplicated in header-cell
  const handleResizeStart = () => onResize("begin", column.current);

  const handleResize = useCallback(
    (e) => {
      const width = getWidthFromMouseEvent(e);
      if (width > 0) {
        onResize("resize", column.current, width);
      }
    },
    [onResize]
  );

  const handleResizeEnd = (e) => {
    const width = getWidthFromMouseEvent(e);
    onResize("end", column.current, width);
  };

  const getWidthFromMouseEvent = (e) => {
    const right = e.pageX;
    const left = el.current.getBoundingClientRect().left;
    return right - left;
  };

  const showContextMenu = useContextMenu();
  const handleContextMenu = (e) => {
    showContextMenu(e, "header", { column });
  };

  const { columns, resizing, width } = groupCol;
  const className = cx("hwHeaderCell", classBase, classNameProp, {
    [`${classBase}-resizing`]: resizing,
  });
  const expandStates = expandStatesfromGroupState(groupCol, groupState);
  return (
    <div
      ref={el}
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
      <Draggable
        className={"resizeHandle"}
        onDrag={handleResize}
        onDragStart={handleResizeStart}
        onDragEnd={handleResizeEnd}
      />
    </div>
  );
};
