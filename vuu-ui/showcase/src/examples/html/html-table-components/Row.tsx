import { DataSourceRow } from "@finos/vuu-data-types";
import {
  KeyedColumnDescriptor,
  RowClickHandler,
} from "@finos/vuu-datagrid-types";
import { ColumnMap, isGroupColumn, metadataKeys } from "@finos/vuu-utils";
import { CSSProperties, memo, MouseEvent, useCallback } from "react";
import { TableCell } from "./TableCell";
import { TableGroupCell } from "./TableGroupCell";
import cx from "classnames";

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
const classBase = "vuuTable2Row";

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
      [SELECTED]: isSelected,
    } = row;

    const handleRowClick = useCallback(
      (evt: MouseEvent<HTMLDivElement>) => {
        const rangeSelect = evt.shiftKey;
        const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
        onClick?.(row, rangeSelect, keepExistingSelection);
      },
      [onClick, row]
    );

    const className = cx(classBase, classNameProp, {
      [`${classBase}-even`]: rowIndex % 2 === 0,
      [`${classBase}-expanded`]: isExpanded,
      [`${classBase}-selected`]: isSelected === 1,
      [`${classBase}-preSelected`]: isSelected === 2,
      [`${classBase}-lastSelected`]: isSelected === 3,
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
        {columns.map((column) => {
          const isGroup = isGroupColumn(column);
          const Cell = isGroup ? TableGroupCell : TableCell;

          return <Cell key={column.key} column={column} row={row} />;
        })}
      </div>
    );
  }
);
Row.displayName = "Row";
