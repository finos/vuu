import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { NewBasketPanel } from "feature-basket-trading";
import { useCallback } from "react";

export const DefaultNewBasketPanel = () => {
  const schema = getSchema("basket");

  // const dataSource = useMemo(
  //   () => vuuModule<BasketsTableName>("BASKET").createDataSource("basket"),
  //   []
  // );

  const handleBasketCreated = useCallback(() => {
    console.log(`save basket`);
  }, []);

  return (
    <LocalDataSourceProvider>
      <NewBasketPanel
        basketSchema={schema}
        onClose={() => console.log("close")}
        onBasketCreated={handleBasketCreated}
      />
    </LocalDataSourceProvider>
  );
};
