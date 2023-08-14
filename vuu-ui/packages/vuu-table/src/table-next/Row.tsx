import { DataSourceRow } from "@finos/vuu-data-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RowClickHandler } from "@finos/vuu-table";
import {
  ColumnMap,
  isGroupColumn,
  metadataKeys,
  notHidden,
  RowSelected,
} from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties, memo, MouseEvent, useCallback } from "react";
import { TableCell } from "./TableCell";
import { TableGroupCell } from "./TableGroupCell";

import "./Row.css";

export type HtmlRowProps = {
  className?: string;
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  row: DataSourceRow;
  offset?: number;
  onClick?: RowClickHandler;
  onToggleGroup?: (row: DataSourceRow, column: KeyedColumnDescriptor) => void;
  style?: CSSProperties;
};

const { IDX, IS_EXPANDED, SELECTED } = metadataKeys;
const classBase = "vuuTableNextRow";

export const Row = memo(
  ({
    className: classNameProp,
    columnMap,
    columns,
    row,
    offset,
    onClick,
    onToggleGroup,
    ...htmlAttributes
  }: HtmlRowProps) => {
    // useEffect(() => {
    //   console.log("row mounted");
    //   return () => {
    //     console.log("row unmounted");
    //   };
    // }, []);

    const {
      [IDX]: rowIndex,
      [IS_EXPANDED]: isExpanded,
      [SELECTED]: selectionStatus,
    } = row;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(row, rangeSelect, keepExistingSelection);
      },
      [onClick, row]
    );

    const { True, First, Last } = RowSelected;

    const className = cx(classBase, classNameProp, {
      [`${classBase}-even`]: rowIndex % 2 === 0,
      [`${classBase}-expanded`]: isExpanded,
      [`${classBase}-selected`]: selectionStatus & True,
      [`${classBase}-selectedStart`]: selectionStatus & First,
      [`${classBase}-selectedEnd`]: selectionStatus & Last,
    });

    const style =
      typeof offset === "number"
        ? { transform: `translate3d(0px, ${offset}px, 0px)` }
        : undefined;

    return (
      <div
        {...htmlAttributes}
        key={`row-${row[0]}`}
        role="row"
        className={className}
        onClick={handleRowClick}
        style={style}
      >
        <span className={`${classBase}-selectionDecorator vuuStickyLeft`} />
        {columns.filter(notHidden).map((column) => {
          const isGroup = isGroupColumn(column);
          const Cell = isGroup ? TableGroupCell : TableCell;

          return <Cell key={column.key} column={column} row={row} />;
        })}
        <span className={`${classBase}-selectionDecorator vuuStickyRight`} />
      </div>
    );
  }
);
Row.displayName = "Row";
