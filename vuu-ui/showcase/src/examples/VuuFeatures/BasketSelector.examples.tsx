import { ArrayDataSource } from "@finos/vuu-data-local";
import { createBasketTradingRow, vuuModule } from "@finos/vuu-data-test";
import { buildColumnMap } from "@finos/vuu-utils";
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
  const [columnMap, dataSource] = useMemo(() => {
    const dataSource = vuuModule("BASKET").createDataSource(
      "basketTrading"
    ) as ArrayDataSource;
    for (const [basketId, basketName, side, status] of testBaskets) {
      dataSource["insert"](
        createBasketTradingRow(basketId, basketName, status, side)
      );
    }
    dataSource.select([1]);
    return [buildColumnMap(dataSource.columns), dataSource];
  }, []);

  const testBasket = new Basket(dataSource.data[1], columnMap);

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  const handleSelectBasket = useCallback(() => null, []);

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
  const [columnMap, dataSource] = useMemo(() => {
    const dataSource = vuuModule("BASKET").createDataSource(
      "basketTrading"
    ) as ArrayDataSource;
    for (const [basketId, basketName, side, status] of testBaskets) {
      dataSource["insert"](
        createBasketTradingRow(basketId, basketName, status, side)
      );
    }
    dataSource.select([3]);
    return [buildColumnMap(dataSource.columns), dataSource];
  }, []);

  const testBasket = new Basket(dataSource.data[3], columnMap);

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
