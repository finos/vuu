import { TableSchema } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { StatusCell } from "../cell-renderers";
import columns from "./basketConstituentLiveColumns";

console.log(`component loaded StatusCell ${typeof StatusCell}`);
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

  console.log({ columns });

  return (
    <TableNext
      {...props}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
