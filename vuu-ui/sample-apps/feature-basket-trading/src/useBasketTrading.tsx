import { useViewContext } from "@finos/vuu-layout";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { NewBasketPanel } from "./new-basket-panel";
import { useBasketTabMenu } from "./useBasketTabMenu";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";

export class Basket {
  basketId: string;
  basketName: string;
  filledPct: number;
  fxRateToUsd: number;
  totalNotional: number;
  totalNotionalUsd: number;
  units: number;

  constructor(data: VuuDataRow, columnMap: ColumnMap) {
    this.basketId = data[columnMap.basketId] as string;
    this.basketName = data[columnMap.basketName] as string;
    this.filledPct = data[columnMap.filledPct] as number;
    this.fxRateToUsd = data[columnMap.fxRateToUsd] as number;
    this.totalNotional = data[columnMap.totalNotional] as number;
    this.totalNotionalUsd = data[columnMap.totalNotionalUsd] as number;
    this.units = data[columnMap.units] as number;
  }
}

export type BasketTradingHookProps = Pick<
  BasketTradingFeatureProps,
  | "basketSchema"
  | "basketTradingSchema"
  | "basketTradingConstituentSchema"
  | "instrumentsSchema"
>;

type BasketState = {
  basketInstanceId?: string;
  dialog?: JSX.Element;
};

const NO_STATE = { basketId: undefined } as any;

export const useBasketTrading = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentSchema,
  instrumentsSchema,
}: BasketTradingHookProps) => {
  const { load, save } = useViewContext();

  const basketInstanceId = useMemo<string>(() => {
    const { basketInstanceId } = load?.("basket-state") ?? NO_STATE;
    return basketInstanceId;
  }, [load]);

  const {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentSchema,
    instrumentsSchema,
  });

  const [basket, setBasket] = useState<Basket | undefined>();

  const [basketCount, setBasketCount] = useState(-1);

  const [basketState, setBasketState] = useState<BasketState>({
    basketInstanceId,
    dialog: undefined,
  });

  const columnMap = useMemo(
    () => buildColumnMap(dataSourceBasketTradingControl.columns),
    [dataSourceBasketTradingControl.columns]
  );

  useMemo(() => {
    dataSourceBasketTradingControl.subscribe(
      {
        range: { from: 0, to: 1 },
      },
      (message) => {
        if (message.type === "viewport-update") {
          if (message.size) {
            setBasketCount(message.size);
          }
          if (message.rows) {
            setBasket(new Basket(message.rows[0], columnMap));
          }
        }
      }
    );

    // TEMP server is notsending TABLE_ROWS if size is zero
    setTimeout(() => {
      setBasketCount((count) => (count === -1 ? 0 : count));
    }, 800);
  }, [columnMap, dataSourceBasketTradingControl]);

  useEffect(() => {
    return () => {
      dataSourceBasketTradingControl.unsubscribe?.();
    };
  }, [dataSourceBasketTradingControl]);

  const handleCloseNewBasketPanel = useCallback(() => {
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

  const handleSelectBasket = useCallback(
    (basketInstanceId: string) => {
      save?.({ basketInstanceId }, "basket-state");
      const filter = { filter: `instanceId = "${basketInstanceId}"` };
      dataSourceBasketTradingConstituent.filter = filter;
      dataSourceBasketTradingControl.filter = filter;
    },
    [dataSourceBasketTradingConstituent, dataSourceBasketTradingControl, save]
  );

  const handleAddBasket = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: (
        <NewBasketPanel
          basketDataSource={dataSourceBasket}
          basketSchema={basketSchema}
          onClose={handleCloseNewBasketPanel}
          onSaveBasket={handleSaveNewBasket}
        />
      ),
    }));
  }, [
    basketSchema,
    dataSourceBasket,
    handleCloseNewBasketPanel,
    handleSaveNewBasket,
  ]);

  const basketSelectorProps = useMemo<Omit<BasketSelectorProps, "basket">>(
    () => ({
      basketInstanceId,
      dataSourceBasketTradingSearch,
      onClickAddBasket: handleAddBasket,
      onSelectBasket: handleSelectBasket,
    }),
    [
      basketInstanceId,
      dataSourceBasketTradingSearch,
      handleAddBasket,
      handleSelectBasket,
    ]
  );

  const [menuBuilder, menuActionHandler] = useBasketTabMenu({
    dataSourceInstruments,
  });

  const contextMenuProps = {
    menuActionHandler,
    menuBuilder,
  };

  return {
    ...basketState,
    activeTabIndex,
    basket,
    basketCount,
    basketSelectorProps,
    contextMenuProps,
    dataSourceBasketTradingConstituent,
    onClickAddBasket: handleAddBasket,
    onSendToMarket,
    onTakeOffMarket,
  };
};
