import {
  BasketsTableName,
  LocalDataSourceProvider,
  getSchema,
  vuuModule,
} from "@finos/vuu-data-test";
import { NewBasketPanel } from "feature-basket-trading";
import { useCallback, useMemo } from "react";
import { BasketCreatedHandler } from "sample-apps/feature-basket-trading/src/new-basket-panel";

let displaySequence = 1;

export const DefaultNewBasketPanel = () => {
  const schema = getSchema("basket");

  // const dataSource = useMemo(
  //   () => vuuModule<BasketsTableName>("BASKET").createDataSource("basket"),
  //   []
  // );

  const handleBasketCreated = useCallback<BasketCreatedHandler>(
    (basketName, basketId, instanceId) => {
      console.log(`save basket #${basketId} as ${basketName} ${instanceId}`);
    },
    [],
  );

  return (
    <LocalDataSourceProvider modules={["BASKET"]}>
      <NewBasketPanel
        basketSchema={schema}
        onClose={() => console.log("close")}
        onBasketCreated={handleBasketCreated}
      />
    </LocalDataSourceProvider>
  );
};
DefaultNewBasketPanel.displaySequence = displaySequence++;
