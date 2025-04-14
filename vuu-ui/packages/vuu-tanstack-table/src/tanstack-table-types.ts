import type { CSSProperties, RefCallback } from "react";
import type {
  ColumnDef as TanstackColumnDef,
  RowData as TanstackRowData,
} from "@tanstack/react-table";
import { VuuRange } from "@finos/vuu-protocol-types";
export type TableColumnDef<T extends TanstackRowData> = TanstackColumnDef<T> & {
  align?: CSSProperties["textAlign"];
  style?: CSSProperties;
  headerStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  footerStyle?: CSSProperties;
  sticky?: boolean;
  hidden?: boolean;
};

export interface RowRenderingHookProps {
  headerHeight: number;
  renderBufferSize?: number;
  rowHeight: number;
  setRange: (range: VuuRange) => void;
  totalRowCount: number;
}

export type RowRenderingHook = (props: RowRenderingHookProps) => {
  contentHeight: number | string;
  scrollableContainerRef?: RefCallback<HTMLDivElement>;
  tableBodyRef?: React.Ref<HTMLDivElement>;
};
