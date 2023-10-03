import { BasketToolbar } from "feature-basket-trading";
import { useMemo } from "react";
import { BasketSelectorProps } from "sample-apps/feature-basket-trading/src/basket-selector";
import { useSchema, useTableConfig } from "../utils";

let displaySequence = 1;

export const DefaultBasketToolbar = () => {
  const schema = useSchema("basketDefinitions");

  const { dataSource: dataSourceBasket } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "SIMUL", table: "basketDefinitions" },
  });

  const { dataSource: dataSourceBasketSearch } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "SIMUL", table: "basketDefinitions" },
  });

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basketId: "001",
      dataSourceBasket,
      dataSourceBasketSearch,
    }),
    [dataSourceBasket, dataSourceBasketSearch]
  );

  return <BasketToolbar BasketSelectorProps={basketSelectorProps} />;
};
DefaultBasketToolbar.displaySequence = displaySequence++;
