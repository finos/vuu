import { BasketSelector } from "feature-basket-trading";
import { useCallback } from "react";
import { useTableConfig } from "../utils";
import { getSchema } from "@finos/vuu-data-test";

let displaySequence = 1;

export const DefaultBasketSelector = () => {
  const schema = getSchema("basketDefinitions");

  const { dataSource: dataSourceBasket } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "SIMUL", table: "basketDefinitions" },
  });

  const { dataSource: datasourceBasketSearch } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: schema.columns.map((col) => col.name),
    },
    table: { module: "SIMUL", table: "basketDefinitions" },
  });

  const handleClickAddBasket = useCallback(() => {
    console.log("Add Basket");
  }, []);

  return (
    <BasketSelector
      dataSourceBasket={dataSourceBasket}
      dataSourceBasketSearch={datasourceBasketSearch}
      basketId="001"
      onClickAddBasket={handleClickAddBasket}
    />
  );
};
DefaultBasketSelector.displaySequence = displaySequence++;
