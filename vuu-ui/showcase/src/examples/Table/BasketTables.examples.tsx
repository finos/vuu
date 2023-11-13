import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { BasketsTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { useVuuMenuActions } from "@finos/vuu-data-react";
import { ContextMenuProvider } from "@finos/vuu-popups";

let displaySequence = 1;

const BasketTable = ({ tableName }: { tableName: BasketsTableName }) => {
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
      <TableNext {...tableProps} renderBufferSize={50} />
    </ContextMenuProvider>
  );
};

export const Basket = () => <BasketTable tableName="basket" />;
Basket.displaySequence = displaySequence++;

export const BasketConstituent = () => (
  <BasketTable tableName="basketConstituent" />
);
BasketConstituent.displaySequence = displaySequence++;

export const BasketTrading = () => <BasketTable tableName="basketTrading" />;
BasketTrading.displaySequence = displaySequence++;

export const AlgoType = () => <BasketTable tableName="algoType" />;
AlgoType.displaySequence = displaySequence++;

export const PriceStrategyType = () => (
  <BasketTable tableName="priceStrategyType" />
);
PriceStrategyType.displaySequence = displaySequence++;
