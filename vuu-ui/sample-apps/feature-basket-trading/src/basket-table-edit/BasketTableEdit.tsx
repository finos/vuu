import { TableSchema } from "@finos/vuu-data-types";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-table-types";
import { Table, TableProps } from "@finos/vuu-table";
import {
  ContextMenuConfiguration,
  ContextMenuProvider,
} from "@finos/vuu-popups";
import { useMemo } from "react";
import { ColHeaderAddSymbol } from "../cell-renderers";

import "./BasketTableEdit.css";

const classBase = "vuuBasketTableEdit";

if (typeof ColHeaderAddSymbol !== "function") {
  console.warn("BasketTableEdit not all custom cell renderers are available");
}

export interface BasketTableEditProps extends Omit<TableProps, "config"> {
  columns: ColumnDescriptor[];
  contextMenuConfig: ContextMenuConfiguration;
  tableSchema: TableSchema;
}

export const BasketTableEdit = ({
  columns,
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
      <Table
        {...props}
        allowDragDrop="drop-only"
        dataSource={dataSource}
        id="basket-constituents"
        renderBufferSize={20}
        className={classBase}
        config={tableConfig}
        rowHeight={21}
      />
    </ContextMenuProvider>
  );
};
