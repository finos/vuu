import { BasketSelector } from "feature-basket-trading";
import { useCallback, useState } from "react";
import { vuuModule } from "@finos/vuu-data-test";
import { Basket } from "feature-basket-trading";

let displaySequence = 1;

export const DefaultBasketSelector = () => {
  const [basket] = useState<Basket>({
    basketId: "basket-001",
    basketName: "Test Basket",
    filledPct: 0.7,
    fxRateToUsd: 1.234,
    totalNotional: 1_000_123,
    totalNotionalUsd: 1_234_000,
    units: 100,
  });
  const dataSource = vuuModule("BASKET").createDataSource("basketTrading");

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  const handleSelectBasket = useCallback(() => {
    console.log("Select Basket");
  }, []);

  return (
    <BasketSelector
      basket={basket}
      basketInstanceId="steve-3"
      dataSourceBasketTradingSearch={dataSource}
      onClickAddBasket={handleClickAddBasket}
      onSelectBasket={handleSelectBasket}
    />
  );
};
DefaultBasketSelector.displaySequence = displaySequence++;
