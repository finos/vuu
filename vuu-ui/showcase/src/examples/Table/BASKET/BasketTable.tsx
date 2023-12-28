import { useVuuMenuActions } from "@finos/vuu-data-react";
import { BasketsTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";

export const BasketTable = ({ tableName }: { tableName: BasketsTableName }) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<BasketsTableName>("BASKET").createDataSource(tableName),
    }),
    [schema.columns, tableName]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <Table {...tableProps} renderBufferSize={50} />
    </ContextMenuProvider>
  );
};
