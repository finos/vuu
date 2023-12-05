import { useVuuMenuActions } from "@finos/vuu-data-react";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import {
  ContextMenuConfiguration,
  NotificationLevel,
  useNotifications,
} from "@finos/vuu-popups";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { BasketChangeHandler } from "./basket-toolbar";
import { NewBasketPanel } from "./new-basket-panel";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { VuuDataRow, VuuDataRowDto } from "packages/vuu-protocol-types";
import { SubscribeCallback, ViewportRpcResponse } from "packages/vuu-data/src";

export class Basket {
  basketId: string;
  basketName: string;
  dataSourceRow: DataSourceRow;
  pctFilled: number;
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
    this.pctFilled = data[columnMap.pctFilled] as number;
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
  | "basketConstituentSchema"
  | "basketTradingSchema"
  | "basketTradingConstituentJoinSchema"
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
  basketConstituentSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
}: BasketTradingHookProps) => {
  const { load, save } = useViewContext();
  const { notify } = useNotifications();

  const basketConstituentMap = useMemo(
    () => buildColumnMap(basketConstituentSchema.columns),
    [basketConstituentSchema]
  );

  const basketInstanceId = useMemo<string>(() => {
    const { basketInstanceId } = load?.("basket-state") ?? NO_STATE;
    return basketInstanceId;
  }, [load]);

  const {
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
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

  const basketDesignContextMenuConfig: ContextMenuConfiguration = {
    menuActionHandler: handleMenuAction,
    menuBuilder: buildViewserverMenuOptions,
  };

  const handleDropInstrument = useCallback(
    (dragDropState) => {
      const constituentRow = dragDropState.payload;
      if (constituentRow) {
        console.log(
          `useBasketTrading handleDropInstrument ${constituentRow.join(",")}`
        );
        const ric = constituentRow[basketConstituentMap.ric];
        dataSourceBasketTradingConstituentJoin
          .rpcCall?.<ViewportRpcResponse>({
            type: "VIEW_PORT_RPC_CALL",
            rpcName: "addConstituent",
            namedParams: {},
            params: [ric],
          })
          .then((response) => {
            if (response?.action.type === "VP_RCP_SUCCESS") {
              notify?.({
                type: NotificationLevel.Success,
                header: "Add Constituent to Basket",
                body: `${ric} added to basket`,
              });
            } else if (response?.action.type === "VP_RCP_FAILURE") {
              notify?.({
                type: NotificationLevel.Error,
                header: "Add Constituent to Basket",
                body: response?.action.msg ?? `Failed to add ${ric} to basket`,
              });
            }
          });
      }
    },
    [basketConstituentMap.ric, dataSourceBasketTradingConstituentJoin, notify]
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
    dataSourceBasketTradingConstituentJoin,
    onClickAddBasket: handleAddBasket,
    onCommitBasketChange: handleCommitBasketChange,
    onDropInstrument: handleDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  };
};
