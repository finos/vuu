import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { BasketsTableName, getSchema } from "@vuu-ui/vuu-data-test";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

export const BasketTable = ({ tableName }: { tableName: BasketsTableName }) => {
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    }),
    [VuuDataSource, schema.columns, schema.table],
  );

  const { menuBuilder, menuActionHandler } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <Table {...tableProps} renderBufferSize={50} />
    </ContextMenuProvider>
  );
};
