import { BasketSelector } from "feature-basket-trading";
import { useCallback } from "react";
import { useTableConfig } from "../utils";
import { getSchema } from "@finos/vuu-data-test";

let displaySequence = 1;

export const DefaultBasketSelector = () => {
  const schema = getSchema("basketTrading");

  const { dataSource: datasourceBasketTrading } = useTableConfig({
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "BASKET", table: "basketTrading" },
  });

  const { dataSource: datasourceBasketTradingSearch } = useTableConfig({
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "BASKET", table: "basketTrading" },
  });

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  return (
    <BasketSelector
      basketInstanceId="steve-3"
      dataSourceBasketTrading={datasourceBasketTrading}
      dataSourceBasketTradingSearch={datasourceBasketTradingSearch}
      onClickAddBasket={handleClickAddBasket}
    />
  );
};
DefaultBasketSelector.displaySequence = displaySequence++;
