import { DataSourceRow } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { CSSProperties, memo } from "react";
import { TableCell } from "./TableCell";

const makeCells = (columns: KeyedColumnDescriptor[], data: DataSourceRow) => {
  const cells = [];
  for (let i = 0; i < columns.length; i++) {
    cells.push(<TableCell key={i} column={columns[i]} row={data} />);
  }
  return cells;
};

export type HtmlRowProps = {
  className?: string;
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  data: VuuRowDataItemType[];
  offset?: number;
  style?: CSSProperties;
};

export const Row = memo(
  ({
    className,
    columnMap,
    columns,
    data,
    offset,
    ...htmlAttributes
  }: HtmlRowProps) => {
    // useEffect(() => {
    //   console.log("row mounted");
    //   return () => {
    //     console.log("row unmounted");
    //   };
    // }, []);

    const style =
      typeof offset === "number"
        ? { transform: `translate3d(0px, ${offset}px, 0px)` }
        : undefined;

    return (
      <div
        {...htmlAttributes}
        key={`row-${data[0]}`}
        role="row"
        className={className}
        style={style}
      >
        {makeCells(columns, data)}
      </div>
    );
  }
);
Row.displayName = "Row";
