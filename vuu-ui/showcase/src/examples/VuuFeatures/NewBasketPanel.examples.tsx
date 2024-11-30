import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";
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
    <LocalDataSourceProvider modules={["BASKET"]}>
      <NewBasketPanel
        basketSchema={schema}
        onClose={() => console.log("close")}
        onBasketCreated={handleBasketCreated}
      />
    </LocalDataSourceProvider>
  );
};
