import { TableSchema } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { ProgressCell, SpreadCell, StatusCell } from "../cell-renderers";
import columns from "./basketConstituentLiveColumns";

if (
  typeof ProgressCell !== "function" ||
  typeof SpreadCell !== "function" ||
  typeof StatusCell !== "function"
) {
  console.warn("BasketTableLive not all custom cell renderers are available");
}

import "./BasketTableLive.css";

const classBase = "vuuBasketTableLive";

export interface BasketTableLiveProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

export const BasketTableLive = ({
  tableSchema,
  ...props
}: BasketTableLiveProps) => {
  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns,
      rowSeparators: true,
    }),
    []
  );

  return (
    <Table
      {...props}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
