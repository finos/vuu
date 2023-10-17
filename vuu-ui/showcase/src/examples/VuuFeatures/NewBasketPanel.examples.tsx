import { NewBasketPanel } from "feature-basket-trading";
import { useCallback, useMemo } from "react";
import { useSchema } from "../utils";
import { createArrayDataSource } from "../utils/createArrayDataSource";

let displaySequence = 1;

export const DefaultNewBasketPanel = () => {
  const schema = useSchema("basket");

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
