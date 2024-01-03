import { TableSchema } from "@finos/vuu-data-types";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-table-types";
import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
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

export interface BasketTableLiveProps extends Omit<TableProps, "config"> {
  columns: ColumnDescriptor[];
  tableSchema: TableSchema;
}

export const BasketTableLive = ({
  columns,
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
