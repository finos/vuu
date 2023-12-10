import { BasketsTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { NewBasketPanel } from "feature-basket-trading";
import { useCallback, useMemo } from "react";

let displaySequence = 1;

export const DefaultNewBasketPanel = () => {
  const schema = getSchema("basket");

  const dataSource = useMemo(
    () => vuuModule<BasketsTableName>("BASKET").createDataSource("basket"),
    []
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
