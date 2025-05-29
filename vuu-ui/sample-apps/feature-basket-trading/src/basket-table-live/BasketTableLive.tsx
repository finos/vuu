import { Table, TableProps } from "@vuu-ui/vuu-table";
import { ProgressCell, SpreadCell, StatusCell } from "../cell-renderers";

if (
  typeof ProgressCell !== "function" ||
  typeof SpreadCell !== "function" ||
  typeof StatusCell !== "function"
) {
  console.warn("BasketTableLive not all custom cell renderers are available");
}

import "./BasketTableLive.css";

const classBase = "vuuBasketTableLive";

export const BasketTableLive = ({ ...props }: TableProps) => {
  return (
    <Table
      {...props}
      renderBufferSize={20}
      className={classBase}
      rowHeight={21}
    />
  );
};
