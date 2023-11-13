import { TableSchema } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import columns from "./basketConstituentEditColumns";

import "./BasketTableEdit.css";

const classBase = "vuuBasketTableEdit";

export interface BasketTableEditProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

export const BasketTableEdit = ({
  dataSource,
  tableSchema,
  ...props
}: BasketTableEditProps) => {
  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns,
      rowSeparators: true,
    }),
    []
  );

  return (
    <TableNext
      {...props}
      dataSource={dataSource}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
