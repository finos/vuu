import { DataSource, TableSchema } from "@finos/vuu-data";
import { useViewContext } from "@finos/vuu-layout";
import { useCallback, useMemo, useState } from "react";
import { NewBasketPanel } from "./new-basket-panel";

export interface BasketTradingHookProsp {
  basketSchema: TableSchema;
  dataSourceBasket: DataSource;
}

type BasketState = {
  basketInstanceId?: string;
  dialog?: JSX.Element;
};

const NO_STATE = { basketId: undefined } as any;

export const useBasketTrading = ({
  basketSchema,
  dataSourceBasket,
}: BasketTradingHookProsp) => {
  const { load, save } = useViewContext();

  const basketInstanceId = useMemo<string>(() => {
    const { basketInstanceId } = load?.("basket-state") ?? NO_STATE;
    if (basketInstanceId) {
      console.log(`loaded basket Id ${basketInstanceId}`);
    }
    return basketInstanceId;
  }, [load]);

  const [basketState, setBasketState] = useState<BasketState>({
    basketInstanceId,
    dialog: undefined,
  });

  const handleClose = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: undefined,
    }));
  }, []);

  const handleSaveNewBasket = useCallback((basketName, basketId) => {
    setBasketState((state) => ({
      ...state,
      dialog: undefined,
    }));
  }, []);

  const handleAddBasket = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: (
        <NewBasketPanel
          basketDataSource={dataSourceBasket}
          basketSchema={basketSchema}
          onClose={handleClose}
          onSaveBasket={handleSaveNewBasket}
        />
      ),
    }));
  }, [basketSchema, dataSourceBasket, handleClose, handleSaveNewBasket]);

  return {
    ...basketState,
    handleAddBasket,
  };
};
