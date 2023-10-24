import { getSchema } from "@finos/vuu-data-test";
import { NewBasketPanel } from "feature-basket-trading";
import { useCallback, useMemo } from "react";
import { createArrayDataSource } from "../utils/createArrayDataSource";

let displaySequence = 1;

export const DefaultNewBasketPanel = () => {
  const schema = getSchema("basket");

  const dataSource = useMemo(
    () => createArrayDataSource({ count: 4, table: schema.table }),
    [schema.table]
  );

  const saveBasket = useCallback((basketName: string, basketId: string) => {
    console.log(`save basket #${basketId} as ${basketName}`);
  }, []);

  return (
    <NewBasketPanel
      basketDataSource={dataSource}
      basketSchema={schema}
      onClose={() => console.log("close")}
      onSaveBasket={saveBasket}
    />
  );
};
DefaultNewBasketPanel.displaySequence = displaySequence++;
