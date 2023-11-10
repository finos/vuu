import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { BasketToolbar } from "feature-basket-trading";
import { useCallback, useMemo, useState } from "react";
import { BasketSelectorProps } from "sample-apps/feature-basket-trading/src/basket-selector";
import { BasketChangeHandler } from "sample-apps/feature-basket-trading/src/basket-toolbar";
import { BasketStatus } from "sample-apps/feature-basket-trading/src/VuuBasketTradingFeature";
import { useTableConfig } from "../utils";

let displaySequence = 1;

export const BasketToolbarDesign = () => {
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("design");

  const basket = useMemo(() => {
    return {
      basketId: ".FTSE",
      basketName: "Test Basket",
      filledPct: 0,
      fxRateToUsd: 1.25,
      totalNotional: 1000,
      totalNotionalUsd: 1000,
      units: 120,
    };
  }, []);

  const dataSourceBasketTradingSearch =
    vuuModule("BASKET").createDataSource("basketTrading");

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basket,
      basketInstanceId: "123",
      dataSourceBasketTradingSearch,
      onClickAddBasket: () => console.log("Add Basket"),
      onSelectBasket: () => undefined,
    }),
    [basket, dataSourceBasketTradingSearch]
  );

  const handleCommitBasketChange = useCallback<BasketChangeHandler>(
    (columnName, value) => {
      console.log(`${columnName} => ${value}`);
    },
    []
  );

  return (
    <BasketToolbar
      basket={basket}
      BasketSelectorProps={basketSelectorProps}
      basketStatus={basketStatus}
      onCommit={handleCommitBasketChange}
      onSendToMarket={() => setBasketStatus("on-market")}
      onTakeOffMarket={() => setBasketStatus("design")}
    />
  );
};
BasketToolbarDesign.displaySequence = displaySequence++;

export const BasketToolbarOnMarket = () => {
  const schema = getSchema("basketDefinitions");
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
      onClickAddBasket: () => console.log("Add Basket"),
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
