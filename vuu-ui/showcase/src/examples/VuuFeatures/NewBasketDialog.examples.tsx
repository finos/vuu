import { getSchema } from "@vuu-ui/vuu-data-test";
import { NewBasketDialog } from "feature-basket-trading";
import { useCallback } from "react";

/** tags=data-consumer */
export const DefaultNewBasketDialog = () => {
  const schema = getSchema("basket");

  // const dataSource = useMemo(
  //   () => vuuModule<BasketsTableName>("BASKET").createDataSource("basket"),
  //   []
  // );

  const handleBasketCreated = useCallback(() => {
    console.log(`save basket`);
  }, []);

  return (
    <NewBasketDialog
      basketSchema={schema}
      onClose={() => console.log("close")}
      onBasketCreated={handleBasketCreated}
    />
  );
};
