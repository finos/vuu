import { HTMLAttributes, UIEventHandler } from "react";
import { ArrayProxy } from "../../utils";
import { HtmlRowProps } from "./Row";

export interface HTMLTableProps extends HTMLAttributes<HTMLDivElement> {
  Row: React.FunctionComponent<HtmlRowProps>;
  bufferCount?: number;
  columns: string[];
  contentHeight: number;
  data: unknown[] | ArrayProxy<unknown>;
  dataRowCount: number;
  headerHeight?: number;
  height?: number;
  onScroll: UIEventHandler<HTMLDivElement>;
  rowHeight?: number;
  viewportHeight: number;
  visibleRowCount?: number;
  width?: number;
}
