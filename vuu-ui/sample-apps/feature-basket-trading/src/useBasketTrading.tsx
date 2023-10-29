import { DataSource, TableSchema } from "@finos/vuu-data";
import { useViewContext } from "@finos/vuu-layout";
import { useCallback, useMemo, useState } from "react";
import { NewBasketPanel } from "./new-basket-panel";

export interface BasketTradingHookProsp {
  basketSchema: TableSchema;
  dataSourceBasket: DataSource;
}

type BasketState = {
  basketId?: string;
  dialog?: JSX.Element;
};

const NO_STATE = { basketId: undefined } as any;

export const useBasketTrading = ({
  basketSchema,
  dataSourceBasket,
}: BasketTradingHookProsp) => {
  const { load, save } = useViewContext();

  const { basketId } = useMemo(() => {
    const { basketId } = load?.("basket-state") ?? NO_STATE;
    if (basketId) {
      console.log(`loaded basketId ${basketId}`);
    }
    return { basketId };
  }, [load]);

  const [basketState, setBasketState] = useState<BasketState>({
    basketId,
    dialog: undefined,
  });

  const handleClose = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: undefined,
    }));
  }, []);

  const handleSaveNewBasket = useCallback((basketName, basketId) => {
    setBasketState({
      basketId,
      dialog: undefined,
    });
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
