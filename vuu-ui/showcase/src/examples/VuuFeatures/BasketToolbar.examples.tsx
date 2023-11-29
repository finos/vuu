import { vuuModule } from "@finos/vuu-data-test";
import { Basket, BasketToolbar } from "feature-basket-trading";
import { useCallback, useMemo, useState } from "react";
import { BasketSelectorProps } from "sample-apps/feature-basket-trading/src/basket-selector";
import { BasketChangeHandler } from "sample-apps/feature-basket-trading/src/basket-toolbar";
import { BasketStatus } from "sample-apps/feature-basket-trading/src/VuuBasketTradingFeature";

let displaySequence = 1;

const testBasket: Basket = {
  dataSourceRow: [] as any,
  basketId: ".FTSE",
  basketName: "Test Basket",
  filledPct: 0,
  fxRateToUsd: 1.25,
  side: "BUY",
  totalNotional: 1403513122789,
  totalNotionalUsd: 1305517122789,
  units: 120,
};

export const BasketToolbarDesign = () => {
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("design");

  const [basket, setBasket] = useState<Basket>(testBasket);

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
      setBasket((basket) => ({ ...basket, [columnName]: value } as Basket));
      return Promise.resolve(true);
    },
    []
  );

  return (
    <BasketToolbar
      basket={basket}
      BasketSelectorProps={basketSelectorProps}
      basketStatus={basketStatus}
      onCommit={handleCommitBasketChange}
      onSendToMarket={() => setBasketStatus(`on-market`)}
      onTakeOffMarket={() => setBasketStatus("design")}
    />
  );
};
BasketToolbarDesign.displaySequence = displaySequence++;

export const BasketToolbarOnMarket = () => {
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("on-market");

  const dataSourceBasketTradingSearch =
    vuuModule("BASKET").createDataSource("basketTrading");

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basket: testBasket,
      basketInstanceId: "123",
      dataSourceBasketTradingSearch,
      onClickAddBasket: () => console.log("Add Basket"),
      onSelectBasket: () => undefined,
    }),
    [dataSourceBasketTradingSearch]
  );

  return (
    <BasketToolbar
      basket={testBasket}
      BasketSelectorProps={basketSelectorProps}
      basketStatus={basketStatus}
      onSendToMarket={() => setBasketStatus("on-market")}
      onTakeOffMarket={() => setBasketStatus("design")}
    />
  );
};
BasketToolbarOnMarket.displaySequence = displaySequence++;
