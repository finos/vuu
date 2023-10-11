import { BasketSelector } from "feature-basket-trading";
import { useSchema, useTableConfig } from "../utils";

let displaySequence = 1;

export const DefaultBasketSelector = () => {
  const schema = useSchema("basketDefinitions");

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

  return (
    <BasketSelector
      dataSourceBasket={dataSourceBasket}
      dataSourceBasketSearch={datasourceBasketSearch}
      basketId="001"
    />
  );
};
DefaultBasketSelector.displaySequence = displaySequence++;
