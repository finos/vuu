import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { vuuModule } from "@vuu-ui/vuu-data-test";
import { buildColumnMap } from "@vuu-ui/vuu-utils";
import { Basket, BasketSelector } from "feature-basket-trading";
import { useCallback, useMemo, useState } from "react";

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
      "basketTrading",
    ) as ArrayDataSource;
    for (const [basketId, basketName, side, status] of testBaskets) {
      dataSource["insert"];
      console.log(
        `create BasketTradingRow ${basketId}m ${basketName} ${status} ${side}`,
      );
      // createBasketTradingRow(basketId, basketName, status, side),
    }
    dataSource.select([1]);
    return [buildColumnMap(dataSource.columns), dataSource];
  }, []);

  const [selectedBasket, setSelectedBasket] = useState(
    new Basket(dataSource.data[1], columnMap),
  );

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  const handleSelectBasket = useCallback(
    (instanceId: string) => {
      const basket = dataSource.data.find(
        (d) => d[columnMap.instanceId] === instanceId,
      );
      if (basket) {
        setSelectedBasket(new Basket(basket, columnMap));
      }
    },

    [columnMap, dataSource.data],
  );

  return (
    <BasketSelector
      basket={selectedBasket}
      basketInstanceId="steve-3"
      dataSourceBasketTradingSearch={dataSource}
      onClickAddBasket={handleClickAddBasket}
      onSelectBasket={handleSelectBasket}
    />
  );
};
