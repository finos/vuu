import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnMenu } from "@vuu-ui/vuu-table-extras";
import { HeaderCellProps } from "@vuu-ui/vuu-table-types";
import { useSortable } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { SortIndicator } from "../column-header-pill";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { useCell } from "../useCell";

import { useForkRef } from "@salt-ds/core";
import headerCellCss from "./HeaderCell.css";

const classBase = "vuuTableHeaderCell";

const doNothing = () => {
  // dummy hook
  return { ref: { current: null } };
};

export const HeaderCell = ({
  allowDragColumnHeader = true,
  className: classNameProp,
  column,
  id,
  index,
  onClick,
  onResize,
  showColumnHeaderMenus = true,
  ...htmlAttributes
}: HeaderCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-header-cell",
    css: headerCellCss,
    window: targetWindow,
  });
  const dragDropSortHook = allowDragColumnHeader ? useSortable : doNothing;
  const { ref: sortableRef } = dragDropSortHook({ id, index });
  const {
    allowColumnHeaderMenu = true,
    HeaderCellContentRenderer,
    HeaderCellLabelRenderer,
  } = column;
  const rootRef = useRef<HTMLDivElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const headerItems = useMemo(() => {
    const sortIndicator = <SortIndicator column={column} />;
    const columnLabel = HeaderCellLabelRenderer ? (
      <HeaderCellLabelRenderer
        className={`${classBase}-label`}
        column={column}
      />
    ) : (
      <div className={`${classBase}-label`}>{column.label ?? column.name}</div>
    );
    const columnContent = HeaderCellContentRenderer
      ? [<HeaderCellContentRenderer column={column} key="content" />]
      : [];

    if (showColumnHeaderMenus && allowColumnHeaderMenu) {
      const menuPermissions =
        showColumnHeaderMenus === true ? undefined : showColumnHeaderMenus;
      const columnMenu = (
        <ColumnMenu column={column} menuPermissions={menuPermissions} />
      );

      if (column.align === "right") {
        return [sortIndicator, columnLabel, columnContent, columnMenu];
      } else {
        return [columnMenu, columnLabel, sortIndicator, columnContent];
      }
    } else {
      if (column.align === "right") {
        return [sortIndicator, columnLabel, columnContent];
      } else {
        return [columnLabel, sortIndicator, columnContent];
      }
    }
  }, [
    HeaderCellContentRenderer,
    HeaderCellLabelRenderer,
    allowColumnHeaderMenu,
    column,
    showColumnHeaderMenus,
  ]);

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (evt) => {
      !isResizing && onClick?.(evt);
    },
    [isResizing, onClick],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (evt) => {
      if (evt.key === "Enter") {
        onClick?.(evt);
      }
    },
    [onClick],
  );

  const { className, style } = useCell(column, classBase, true);

  return (
    <div
      {...htmlAttributes}
      aria-colindex={column.ariaColIndex}
      aria-label={`${column.label ?? column.name} column header`}
      className={cx(className, classNameProp, {
        [`${classBase}-resizing`]: isResizing,
        [`${classBase}-noMenu`]: showColumnHeaderMenus === false,
      })}
      data-column-name={column.name}
      data-index={index}
      id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      ref={useForkRef<HTMLDivElement>(rootRef, sortableRef)}
      role="columnheader"
      style={style}
    >
      {...headerItems}
      {column.resizeable !== false ? <ColumnResizer {...resizeProps} /> : null}
    </div>
  );
};
