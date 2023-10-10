import { BasketToolbar } from "feature-vuu-basket-trading";
import { useCallback, useMemo, useState } from "react";
import { BasketSelectorProps } from "sample-apps/feature-basket-trading/src/basket-selector";
import { BasketStatus } from "sample-apps/feature-basket-trading/src/VuuBasketTradingFeature";
import { useSchema, useTableConfig } from "../utils";

let displaySequence = 1;

export const BasketToolbarDesign = () => {
  const schema = useSchema("basketDefinitions");
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("design");

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

  return (
    <BasketToolbar
      BasketSelectorProps={basketSelectorProps}
      basketStatus={basketStatus}
      onSendToMarket={() => setBasketStatus("on-market")}
      onTakeOffMarket={() => setBasketStatus("design")}
    />
  );
};
BasketToolbarDesign.displaySequence = displaySequence++;

export const BasketToolbarOnMarket = () => {
  const schema = useSchema("basketDefinitions");
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("on-market");

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

  return (
    <BasketToolbar
      BasketSelectorProps={basketSelectorProps}
      basketStatus={basketStatus}
      onSendToMarket={() => setBasketStatus("on-market")}
      onTakeOffMarket={() => setBasketStatus("design")}
    />
  );
};
BasketToolbarOnMarket.displaySequence = displaySequence++;
