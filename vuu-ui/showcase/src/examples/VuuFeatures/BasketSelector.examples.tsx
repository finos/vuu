import { ArrayDataSource } from "@finos/vuu-data-local";
import { createBasketTradingRow, vuuModule } from "@finos/vuu-data-test";
import { Basket, BasketSelector } from "feature-basket-trading";
import { useCallback, useMemo } from "react";

let displaySequence = 1;

const testBaskets = [
  ["Amber-0001", "Amber Basket", "OFF MARKET", "BUY"],
  ["Blue-0002", "Blue Basket", "ON MARKET", "SELL"],
  ["Charcoal-0003", "Charcoal Basket", "OFF MARKET", "BUY"],
  ["Dandruff-0004", "Dandruff Basket", "ON MARKET", "BUY"],
  ["Elephant-0005", "Elephant Basket", "OFF MARKET", "SELL"],
  ["Frogger-0006", "Frogger Basket", "OFF MARKET", "BUY"],
  ["Gray-0007", "Gray Basket", "ON MARKET", "SELL"],
  ["Helium-0008", "Helium Basket", "OFF MARKET", "BUY"],
  ["Indigo-0009", "Indigo Basket", "OFF MARKET", "BUY"],
];

export const DefaultBasketSelector = () => {
  const testBasket: Basket = {
    dataSourceRow: [] as any,
    basketId: ".FTSE",
    basketName: "Test Basket",
    pctFilled: 0,
    fxRateToUsd: 1.25,
    instanceId: "steve-001",
    side: "BUY",
    status: "off-market",
    totalNotional: 1000,
    totalNotionalUsd: 1000,
    units: 120,
  };

  const dataSource = useMemo(() => {
    const dataSource = vuuModule("BASKET").createDataSource(
      "basketTrading"
    ) as ArrayDataSource;
    for (const [basketId, basketName, side, status] of testBaskets) {
      dataSource["insert"](
        createBasketTradingRow(basketId, basketName, status, side)
      );
    }
    return dataSource;
  }, []);

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  const handleSelectBasket = useCallback(() => {}, []);

  return (
    <BasketSelector
      basket={testBasket}
      basketInstanceId="steve-3"
      dataSourceBasketTradingSearch={dataSource}
      onClickAddBasket={handleClickAddBasket}
      onSelectBasket={handleSelectBasket}
    />
  );
};
DefaultBasketSelector.displaySequence = displaySequence++;

export const OpenBasketSelector = () => {
  const testBasket: Basket = {
    dataSourceRow: [] as any,
    basketId: ".FTSE",
    basketName: "Test Basket",
    pctFilled: 0,
    fxRateToUsd: 1.25,
    instanceId: "steve-001",
    side: "BUY",
    status: "ioff-market",
    totalNotional: 1000,
    totalNotionalUsd: 1000,
    units: 120,
  };

  const dataSource = useMemo(() => {
    const dataSource = vuuModule("BASKET").createDataSource(
      "basketTrading"
    ) as ArrayDataSource;
    for (const [basketId, basketName, side, status] of testBaskets) {
      dataSource["insert"](
        createBasketTradingRow(basketId, basketName, status, side)
      );
    }
    return dataSource;
  }, []);

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  const handleSelectBasket = useCallback(() => {
    console.log("Select Basket");
  }, []);

  return (
    <BasketSelector
      basket={testBasket}
      basketInstanceId="steve-3"
      dataSourceBasketTradingSearch={dataSource}
      isOpen={true}
      onClickAddBasket={handleClickAddBasket}
      onSelectBasket={handleSelectBasket}
    />
  );
};
OpenBasketSelector.displaySequence = displaySequence++;
