import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { CSSProperties, HTMLAttributes, memo } from "react";

const makeCells = (
  columns: KeyedColumnDescriptor[],
  data: unknown[],
  Element: "td" | "div" = "td",
  attributes?: HTMLAttributes<HTMLElement>
) => {
  const cells = [];
  for (let i = 0; i < columns.length; i++) {
    const { key } = columns[i];
    cells.push(
      <Element key={i} {...attributes}>
        {data[key]}
      </Element>
    );
  }
  return cells;
};

export type HtmlRowProps = {
  cellWidth?: number;
  className?: string;
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  data: VuuRowDataItemType[];
  Element?: "tr" | "div";
  offset?: number;
  style?: CSSProperties;
};

export const Row = memo(
  ({
    cellWidth = 145,
    className,
    columnMap,
    columns,
    data,
    Element = "div",
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
      <Element
        {...htmlAttributes}
        key={`row-${data[0]}`}
        role="row"
        className={className}
        style={style}
      >
        {makeCells(columns, data, Element === "tr" ? "td" : "div", {
          role: "cell",
          style: { width: cellWidth },
        })}
      </Element>
    );
  }
);
Row.displayName = "Row";
