import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import {
  DataSourceRow,
  RpcResponseHandler,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { VuuDataRow } from "@vuu-ui/vuu-protocol-types";
import { TableConfig, TableConfigChangeHandler } from "@vuu-ui/vuu-table-types";
import { type ColumnMap, metadataKeys, Range } from "@vuu-ui/vuu-utils";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import type { BasketSelectorProps } from "./basket-selector";
import defaultEditColumns from "./basket-table-edit/basketConstituentEditColumns";
import defaultLiveColumns from "./basket-table-live/basketConstituentLiveColumns";
import type { BasketChangeHandler } from "./basket-toolbar";
import { NewBasketDialog } from "./new-basket-dialog/NewBasketDialog";
import { type BasketCreatedHandler } from "./new-basket-dialog/useNewBasketDialog";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";
import { DragDropState } from "@vuu-ui/vuu-ui-controls";

const { KEY } = metadataKeys;

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

type BasketState = {
  basketInstanceId?: string;
  dialog?: ReactElement;
};

const NO_STATE = { basketInstanceId: undefined } as {
  basketInstanceId: undefined;
};

export const useBasketTrading = () => {
  const { load, save } = useViewContext();
  const { showNotification } = useNotifications();

  const editConfig = useMemo<TableConfig>(() => {
    const config = load?.("basket-edit-table-config") as TableConfig;
    return (
      config ?? {
        columns: defaultEditColumns,
        rowSeparators: true,
      }
    );
  }, [load]);

  const liveConfig = useMemo<TableConfig>(() => {
    const config = load?.("basket-live-table-config") as TableConfig;
    return (
      config ?? {
        columns: defaultLiveColumns,
        rowSeparators: true,
      }
    );
  }, [load]);

  const basketInstanceId = useMemo<string | undefined>(() => {
    const { basketInstanceId } =
      load<{ basketInstanceId: string }>?.("basket-state") ?? NO_STATE;
    return basketInstanceId;
  }, [load]);

  const {
    basketConstituentMap,
    basketSchema,
    basketTradingMap,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({ basketInstanceId });

  const [basket, setBasket] = useState<Basket | undefined>();

  const [basketCount, setBasketCount] = useState(-1);

  const [basketState, setBasketState] = useState<BasketState>({
    basketInstanceId,
    dialog: undefined,
  });

  const handleMessageFromBasketTradingControl =
    useCallback<DataSourceSubscribeCallback>(
      (message) => {
        if (message.type === "viewport-update") {
          if (message.size) {
            setBasketCount(message.size);
          }
          if (message.rows && message.rows.length > 0 && basketTradingMap) {
            setBasket(new Basket(message.rows[0], basketTradingMap));
          }
        }
      },
      [basketTradingMap],
    );

  useMemo(() => {
    dataSourceBasketTradingControl?.subscribe(
      {
        range: Range(0, 1),
      },
      handleMessageFromBasketTradingControl,
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

  const handleSelectBasket = useCallback(
    (basketInstanceId: string) => {
      if (
        dataSourceBasketTradingConstituentJoin &&
        dataSourceBasketTradingControl
      ) {
        save?.({ basketInstanceId }, "basket-state");
        const filter = { filter: `instanceId = "${basketInstanceId}"` };
        dataSourceBasketTradingConstituentJoin.filter = filter;
        dataSourceBasketTradingControl.filter = filter;
      }
    },
    [
      dataSourceBasketTradingConstituentJoin,
      dataSourceBasketTradingControl,
      save,
    ],
  );

  const handleBasketCreated = useCallback<BasketCreatedHandler>(
    (basketName, basketId, instanceId) => {
      handleSelectBasket(instanceId);
      setBasketState((state) => ({
        ...state,
        dialog: undefined,
      }));
    },
    [handleSelectBasket],
  );

  const handleAddBasket = useCallback(() => {
    if (basketSchema) {
      setBasketState((state) => ({
        ...state,
        dialog: (
          <NewBasketDialog
            basketSchema={basketSchema}
            onClose={handleCloseNewBasketPanel}
            onBasketCreated={handleBasketCreated}
          />
        ),
      }));
    }
  }, [basketSchema, handleBasketCreated, handleCloseNewBasketPanel]);

  const basketSelectorProps = useMemo<
    Omit<BasketSelectorProps, "basket"> | undefined
  >(
    () =>
      dataSourceBasketTradingSearch
        ? {
            basketInstanceId,
            dataSourceBasketTradingSearch,
            onClickAddBasket: handleAddBasket,
            onSelectBasket: handleSelectBasket,
          }
        : undefined,
    [
      basketInstanceId,
      dataSourceBasketTradingSearch,
      handleAddBasket,
      handleSelectBasket,
    ],
  );

  const handleCommitBasketChange = useCallback<BasketChangeHandler>(
    (columnName, value) => {
      if (basket && dataSourceBasketTradingControl) {
        const key = basket.dataSourceRow[KEY];
        return dataSourceBasketTradingControl.applyEdit(key, columnName, value);
      }
      return Promise.resolve(true);
    },
    [basket, dataSourceBasketTradingControl],
  );

  const handleRpcResponse = useCallback<RpcResponseHandler>((response) => {
    console.log("handleRpcResponse", {
      response,
    });
    return true;
  }, []);

  const { menuBuilder, menuActionHandler } = useVuuMenuActions({
    dataSource: dataSourceBasketTradingConstituentJoin,
    menuActionConfig: undefined,
    onRpcResponse: handleRpcResponse,
  });

  const basketDesignContextMenuConfig = {
    menuActionHandler,
    menuBuilder,
  };

  const handleDropInstrument = useCallback(
    (dragDropState: DragDropState) => {
      const constituentRow = dragDropState.payload as VuuDataRow;
      if (constituentRow && basketConstituentMap) {
        const ric = constituentRow[basketConstituentMap.ric] as string;
        dataSourceBasketTradingConstituentJoin
          ?.rpcRequest?.({
            params: { ric },
            rpcName: "addConstituent",
            type: "RPC_REQUEST",
          })
          .then((response) => {
            if (response?.type === "SUCCESS_RESULT") {
              showNotification?.({
                content: `${ric} added to basket`,
                header: "Add Constituent to Basket",
                status: "success",
                type: NotificationType.Toast,
              });
            } else if (response?.type === "ERROR_RESULT") {
              showNotification?.({
                content:
                  response?.errorMessage ?? `Failed to add ${ric} to basket`,
                header: "Add Constituent to Basket",
                status: "error",
                type: NotificationType.Toast,
              });
            }
          });
      }
    },
    [
      basketConstituentMap,
      dataSourceBasketTradingConstituentJoin,
      showNotification,
    ],
  );

  const handleConfigChangeEdit = useCallback<TableConfigChangeHandler>(
    (config) => {
      save?.(config, "basket-edit-table-config");
    },
    [save],
  );

  const handleConfigChangeLive = useCallback<TableConfigChangeHandler>(
    (config) => {
      save?.(config, "basket-live-table-config");
    },
    [save],
  );

  useEffect(() => {
    dataSourceBasketTradingControl?.resume?.();
    return () => {
      dataSourceBasketTradingControl?.suspend?.();
    };
  }, [dataSourceBasketTradingControl]);

  return {
    ...basketState,
    basket,
    basketCount,
    basketDesignContextMenuConfig,
    basketSelectorProps,
    dataSourceBasketTradingConstituentJoin,
    editConfig,
    liveConfig,
    onClickAddBasket: handleAddBasket,
    onCommitBasketChange: handleCommitBasketChange,
    onConfigChangeEdit: handleConfigChangeEdit,
    onConfigChangeLive: handleConfigChangeLive,
    onDropInstrument: handleDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  };
};
