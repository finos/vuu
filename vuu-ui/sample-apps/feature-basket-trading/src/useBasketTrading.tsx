import { useVuuMenuActions } from "@finos/vuu-data-react";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { ContextMenuConfiguration } from "@finos/vuu-popups";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { BasketChangeHandler } from "./basket-toolbar";
import { NewBasketPanel } from "./new-basket-panel";
import { useBasketContextMenus } from "./useBasketContextMenus";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { VuuDataRow, VuuDataRowDto } from "packages/vuu-protocol-types";
import { SubscribeCallback } from "packages/vuu-data/src";

export class Basket {
  basketId: string;
  basketName: string;
  dataSourceRow: DataSourceRow;
  filledPct: number;
  fxRateToUsd: number;
  instanceId: string;
  side: string;
  status: string;
  totalNotional: number;
  totalNotionalUsd: number;
  units: number;

  constructor(data: DataSourceRow, columnMap: ColumnMap) {
    this.dataSourceRow = data;
    this.basketId = data[columnMap.basketId] as string;
    this.basketName = data[columnMap.basketName] as string;
    this.filledPct = data[columnMap.filledPct] as number;
    this.fxRateToUsd = data[columnMap.fxRateToUsd] as number;
    this.instanceId = data[columnMap.instanceId] as string;
    this.side = data[columnMap.side] as string;
    this.status = data[columnMap.status] as string;
    this.totalNotional = data[columnMap.totalNotional] as number;
    this.totalNotionalUsd = data[columnMap.totalNotionalUsd] as number;
    this.units = data[columnMap.units] as number;
  }
}

export type BasketTradingHookProps = Pick<
  BasketTradingFeatureProps,
  | "basketSchema"
  | "basketTradingSchema"
  | "basketTradingConstituentJoinSchema"
  | "basketConstituentSchema"
>;

const toDataDto = (dataSourceRow: VuuDataRow, columnMap: ColumnMap) => {
  Object.entries(columnMap).reduce<VuuDataRowDto>((dto, [colName, index]) => {
    dto[colName] = dataSourceRow[index];
    return dto;
  }, {});
};

type BasketState = {
  basketInstanceId?: string;
  dialog?: JSX.Element;
};

const NO_STATE = { basketId: undefined } as any;

export const useBasketTrading = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  basketConstituentSchema,
}: BasketTradingHookProps) => {
  const { load, save } = useViewContext();

  const basketInstanceId = useMemo<string>(() => {
    const { basketInstanceId } = load?.("basket-state") ?? NO_STATE;
    return basketInstanceId;
  }, [load]);

  const {
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceBasketConstituent,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    basketConstituentSchema,
  });

  const [basket, setBasket] = useState<Basket | undefined>();

  const [basketCount, setBasketCount] = useState(-1);

  const [basketState, setBasketState] = useState<BasketState>({
    basketInstanceId,
    dialog: undefined,
  });

  const columnMapBasketTrading = useMemo(
    () => buildColumnMap(dataSourceBasketTradingControl.columns),
    [dataSourceBasketTradingControl.columns]
  );

  const handleMessageFromBasketTradingControl = useCallback<SubscribeCallback>(
    (message) => {
      if (message.type === "viewport-update") {
        if (message.size) {
          setBasketCount(message.size);
        }
        if (message.rows && message.rows.length > 0) {
          setBasket(new Basket(message.rows[0], columnMapBasketTrading));
        }
      }
    },
    [columnMapBasketTrading]
  );

  useMemo(() => {
    dataSourceBasketTradingControl.subscribe(
      {
        range: { from: 0, to: 1 },
      },
      handleMessageFromBasketTradingControl
    );

    // TEMP server is notsending TABLE_ROWS if size is zero
    setTimeout(() => {
      setBasketCount((count) => (count === -1 ? 0 : count));
    }, 800);
  }, [dataSourceBasketTradingControl, handleMessageFromBasketTradingControl]);

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
      dataSourceBasketTradingConstituentJoin.filter = filter;
      dataSourceBasketTradingControl.filter = filter;
    },
    [
      dataSourceBasketTradingConstituentJoin,
      dataSourceBasketTradingControl,
      save,
    ]
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

  const handleCommitBasketChange = useCallback<BasketChangeHandler>(
    (columnName, value) => {
      if (basket) {
        const { dataSourceRow } = basket;
        return dataSourceBasketTradingControl.applyEdit(
          dataSourceRow,
          columnName,
          value
        );
      }
      return Promise.resolve(true);
    },
    [basket, dataSourceBasketTradingControl]
  );

  const [menuBuilder, menuActionHandler] = useBasketContextMenus({
    dataSourceBasketConstituent,
  });

  const handleRpcResponse = useCallback((response) => {
    console.log("handleRpcResponse", {
      response,
    });
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: dataSourceBasketTradingConstituentJoin,
    menuActionConfig: undefined,
    onRpcResponse: handleRpcResponse,
  });

  const contextMenuProps: ContextMenuConfiguration = {
    menuActionHandler,
    menuBuilder,
  };

  const basketDesignContextMenuConfig: ContextMenuConfiguration = {
    menuActionHandler: handleMenuAction,
    menuBuilder: buildViewserverMenuOptions,
  };

  const handleDropInstrument = useCallback(
    (dragDropState) => {
      console.log(`useBasketTrading handleDropInstrument`, {
        instrument: dragDropState.payload,
      });
      const key = "steve-00001.AAA.L";
      const data = {
        algo: -1,
        algoParams: "",
        basketId: ".FTSE100",
        description: "Test",
        instanceId: "steve-00001",
        instanceIdRic: "steve-00001.AAA.L",
        limitPrice: 0,
        notionalLocal: 0,
        notionalUsd: 0,
        pctFilled: 0,
        priceSpread: 0,
        priceStrategyId: 2,
        quantity: 0,
        ric: "AAL.L",
        side: "BUY",
        venue: "",
        weighting: 1,
      };
      dataSourceBasketTradingControl.insertRow?.(key, data).then((response) => {
        console.log({ response });
      });
    },
    [dataSourceBasketTradingControl]
  );

  useEffect(() => {
    dataSourceBasketTradingControl.resume?.();
    return () => {
      dataSourceBasketTradingControl.suspend?.();
    };
  }, [dataSourceBasketTradingControl]);

  return {
    ...basketState,
    basket,
    basketCount,
    basketDesignContextMenuConfig,
    basketSelectorProps,
    contextMenuProps,
    dataSourceBasketTradingConstituentJoin,
    onClickAddBasket: handleAddBasket,
    onCommitBasketChange: handleCommitBasketChange,
    onDropInstrument: handleDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  };
};
