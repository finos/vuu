import { memo, useEffect } from "react";
import { TableElementWithSizers } from "./html-table-components";
import { ArrayProxy, VuuRowGenerator } from "../utils";

import "./HtmlTable.examples.css";

import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { RowProps } from "@finos/vuu-table/src/TableRow";
const dataRowCount = 1000;
const columnCount = 10;

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
  data: VuuRowDataItemType[];
};

const Row = memo(({ data }: HtmlRowProps) => {
  useEffect(() => {
    console.log("row mounted");
    return () => {
      console.log("row unmounted");
    };
  }, []);

  return (
    <tr key={`row-${data[0]}`}>
      {data.map((item, i) => (
        <td key={i}>{item}</td>
      ))}
    </tr>
  );
});
Row.displayName = "Row";

export const Table = () => {
  const contentHeight = data.length * rowHeight;

  return (
    <TableElementWithSizers
      bufferCount={bufferCount}
      contentHeight={contentHeight}
      data={data}
      headerHeight={headerHeight}
      Row={Row}
      viewportHeight={viewportHeight}
      visibleRowCount={visibleRowCount}
    />
  );
};
