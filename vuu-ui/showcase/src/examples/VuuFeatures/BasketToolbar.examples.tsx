import { Basket, BasketToolbar } from "feature-basket-trading";
import { useCallback, useMemo, useState } from "react";
import { BasketSelectorProps } from "feature-basket-trading/src/basket-selector";
import { BasketChangeHandler } from "feature-basket-trading/src/basket-toolbar";
import { BasketStatus } from "feature-basket-trading/src/VuuBasketTradingFeature";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { useData } from "@vuu-ui/vuu-utils";

const testBasket: Basket = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataSourceRow: [] as any,
  basketId: ".FTSE",
  basketName: "Test Basket",
  pctFilled: 0,
  fxRateToUsd: 1.25,
  instanceId: "steve-001",
  side: "BUY",
  status: "off-market",
  totalNotional: 1403513122789,
  totalNotionalUsd: 1305517122789,
  units: 120,
};

export const BasketToolbarDesign = () => {
  const schema = getSchema("basketTrading");
  const { VuuDataSource } = useData();

  const [basketStatus, setBasketStatus] = useState<BasketStatus>("design");

  const [basket, setBasket] = useState<Basket>(testBasket);

  const dataSourceBasketTradingSearch = useMemo(
    () =>
      new VuuDataSource({
        table: schema.table,
      }),
    [VuuDataSource, schema],
  );

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basket,
      basketInstanceId: "123",
      dataSourceBasketTradingSearch,
      onClickAddBasket: () => console.log("Add Basket"),
      onSelectBasket: () => undefined,
    }),
    [basket, dataSourceBasketTradingSearch],
  );

  const handleCommitBasketChange = useCallback<BasketChangeHandler>(
    (columnName, value) => {
      console.log(`${columnName} => ${value}`);
      setBasket((basket) => ({ ...basket, [columnName]: value }) as Basket);
      return Promise.resolve(true);
    },
    [],
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

export const BasketToolbarOnMarket = () => {
  const [basketStatus, setBasketStatus] = useState<BasketStatus>("on-market");
  const schema = getSchema("basketTrading");
  const { VuuDataSource } = useData();

  const dataSourceBasketTradingSearch = useMemo(
    () =>
      new VuuDataSource({
        table: schema.table,
      }),
    [VuuDataSource, schema],
  );

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basket: testBasket,
      basketInstanceId: "123",
      dataSourceBasketTradingSearch,
      onClickAddBasket: () => console.log("Add Basket"),
      onSelectBasket: () => undefined,
    }),
    [dataSourceBasketTradingSearch],
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
