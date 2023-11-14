import { TableSchema } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import {
  ContextMenuConfiguration,
  ContextMenuProvider,
} from "@finos/vuu-popups";
import { useMemo } from "react";
import columns from "./basketConstituentEditColumns";

import "./BasketTableEdit.css";

const classBase = "vuuBasketTableEdit";

export interface BasketTableEditProps extends Omit<TableProps, "config"> {
  contextMenuConfig: ContextMenuConfiguration;
  tableSchema: TableSchema;
}

export const BasketTableEdit = ({
  contextMenuConfig,
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
    <ContextMenuProvider {...contextMenuConfig}>
      <TableNext
        {...props}
        dataSource={dataSource}
        renderBufferSize={20}
        className={classBase}
        config={tableConfig}
        rowHeight={21}
      />
    </ContextMenuProvider>
  );
};
