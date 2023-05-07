import { CSSProperties, HTMLAttributes, memo } from "react";
import {
  DivElementWithSizers,
  DivElementWithTranslate,
  DivElementKeyedWithTranslate,
  TableElementWithSizers,
  DivElementKeyedWithTranslateInlineScrollbars,
} from "./html-table-components";
import { ArrayProxy, VuuColumnGenerator, VuuRowGenerator } from "../utils";

import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { RowProps } from "@finos/vuu-table/src/TableRow";
const dataRowCount = 1000;
const columnCount = 10;

let displaySequence = 1;

const columns = VuuColumnGenerator(columnCount);

const data = new ArrayProxy<VuuRowDataItemType[]>(
  dataRowCount,
  VuuRowGenerator(columnCount)
);

const bufferCount = 5;
const rowHeight = 30;
const headerHeight = 30;
const viewportHeight = 700;
const visibleRowCount = 20;

export type ComponentTypeNoChildren<T = unknown> = (props: T) => JSX.Element;
export type RowType = ComponentTypeNoChildren<RowProps>;
export type HtmlRowProps = {
  cellWidth?: number;
  className?: string;
  data: VuuRowDataItemType[];
  offset?: number;
  style?: CSSProperties;
};

const makeCells = (
  data: unknown[],
  Element: "td" | "div" = "td",
  attributes?: HTMLAttributes<HTMLElement>
) => {
  const cells = [];
  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      cells.push(
        <Element key={i} {...attributes}>
          {data[i]}
        </Element>
      );
    }
  }
  return cells;
};

const Row = memo(({ className, data }: HtmlRowProps) => {
  // useEffect(() => {
  //   console.log("row mounted");
  //   return () => {
  //     console.log("row unmounted");
  //   };
  // }, []);

  return (
    <tr key={`row-${data[0]}`} className={className}>
      {makeCells(data)}
    </tr>
  );
});
Row.displayName = "Row";

const DivRow = memo(
  ({
    cellWidth = 145,
    className,
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
        {makeCells(data, "div", {
          role: "cell",
          style: { width: cellWidth },
        })}
      </div>
    );
  }
);
DivRow.displayName = "Row";

export const DefaultTableElementWithSizers = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <TableElementWithSizers
      bufferCount={bufferCount}
      columns={columns}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={Row}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
DefaultTableElementWithSizers.displaySequence = displaySequence++;

export const DefaultDivElementWithSizers = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <DivElementWithSizers
      bufferCount={bufferCount}
      columns={columns}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={DivRow}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
DefaultDivElementWithSizers.displaySequence = displaySequence++;

export const DefaultDivElementWithTranslate = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <DivElementWithTranslate
      bufferCount={bufferCount}
      columns={columns}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={DivRow}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
DefaultDivElementWithTranslate.displaySequence = displaySequence++;

export const DefaultDivElementKeyedWithTranslate = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <DivElementKeyedWithTranslate
      bufferCount={bufferCount}
      columns={columns}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={DivRow}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
DefaultDivElementKeyedWithTranslate.displaySequence = displaySequence++;

export const DefaultDivElementKeyedWithTranslateInlineScrollbars = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <DivElementKeyedWithTranslateInlineScrollbars
      bufferCount={bufferCount}
      columns={columns}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={DivRow}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
DefaultDivElementKeyedWithTranslateInlineScrollbars.displaySequence =
  displaySequence++;
