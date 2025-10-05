import { useViewContext } from "@vuu-ui/vuu-layout";
import {
  DataSource,
  DataSourceConfig,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { useCallback, useMemo, useState } from "react";
import { useNotifications } from "@vuu-ui/vuu-popups";
import { buildColumnMap, ColumnMap, useData } from "@vuu-ui/vuu-utils";
import { VuuRpcServiceRequest } from "@vuu-ui/vuu-protocol-types";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent-join"
  | "data-source-basket-constituent";

type BasketTableState = {
  basketSchema: TableSchema;
  basketConstituentMap: ColumnMap;
  basketConstituentSchema: TableSchema;
  basketTradingMap: ColumnMap;
  basketTradingSchema: TableSchema;
  basketTradingConstituentJoinSchema: TableSchema;
  dataSourceBasketConstituents: DataSource;
  dataSourceBasketTradingControl: DataSource;
  dataSourceBasketTradingSearch: DataSource;
  dataSourceBasketTradingConstituentJoin: DataSource;
};

const module = "BASKET";

export const useBasketTradingDataSources = ({
  basketInstanceId,
}: {
  basketInstanceId?: string;
}) => {
  const [basketState, setBasketState] = useState<BasketTableState>();
  const { showNotification } = useNotifications();
  const { id, loadSession, saveSession, title } = useViewContext();
  const { getServerAPI, VuuDataSource } = useData();

  useMemo(async () => {
    const serverAPI = await getServerAPI();
    const [
      basketSchema,
      basketConstituentSchema,
      basketTradingSchema,
      basketTradingConstituentJoinSchema,
    ] = await Promise.all([
      serverAPI.getTableSchema({ module, table: "basket" }),
      serverAPI.getTableSchema({ module, table: "basketConstituent" }),
      serverAPI.getTableSchema({ module, table: "basketTrading" }),
      serverAPI.getTableSchema({
        module,
        table: "basketTradingConstituentJoin",
      }),
    ]);

    const filterSpec: DataSourceConfig["filterSpec"] = basketInstanceId
      ? {
          filter: `instanceId = "${basketInstanceId}"`,
        }
      : undefined;

    const basketTradingControlKey = `data-source-basket-trading-control`;
    let dataSourceBasketTradingControl = loadSession?.(
      basketTradingControlKey,
    ) as DataSource;
    if (!dataSourceBasketTradingControl) {
      dataSourceBasketTradingControl = new VuuDataSource({
        bufferSize: 0,
        filterSpec,
        viewport: `${id}-${basketTradingControlKey}`,
        table: basketTradingSchema.table,
        columns: basketTradingSchema.columns.map((col) => col.name),
        title,
      });
      saveSession?.(dataSourceBasketTradingControl, basketTradingControlKey);
    }

    const basketTradingSearchKey = `data-source-basket-trading-search`;
    let dataSourceBasketTradingSearch = loadSession?.(
      basketTradingSearchKey,
    ) as DataSource;
    if (!dataSourceBasketTradingSearch) {
      dataSourceBasketTradingSearch = new VuuDataSource({
        bufferSize: 100,
        viewport: `${id}-${basketTradingSearchKey}`,
        table: basketTradingSchema.table,
        columns: basketTradingSchema.columns.map((col) => col.name),
        title,
      });
      saveSession?.(dataSourceBasketTradingSearch, basketTradingSearchKey);
    }

    const basketTradingConstituentJoinKey = `data-source-basket-trading-constituent-join`;
    let dataSourceBasketTradingConstituentJoin = loadSession?.(
      basketTradingConstituentJoinKey,
    ) as DataSource;
    if (!dataSourceBasketTradingConstituentJoin) {
      dataSourceBasketTradingConstituentJoin = new VuuDataSource({
        bufferSize: 100,
        filterSpec,
        viewport: `${id}-${basketTradingConstituentJoinKey}`,
        table: basketTradingConstituentJoinSchema.table,
        columns: basketTradingConstituentJoinSchema.columns.map(
          (col) => col.name,
        ),
        title,
      });
      saveSession?.(
        dataSourceBasketTradingConstituentJoin,
        basketTradingConstituentJoinKey,
      );
    }

    const basketConstituentsKey = `data-source-basket-constituent`;
    let dataSourceBasketConstituents = loadSession?.(
      basketConstituentsKey,
    ) as DataSource;
    if (!dataSourceBasketConstituents) {
      dataSourceBasketConstituents = new VuuDataSource({
        bufferSize: 100,
        sort: { sortDefs: [{ column: "description", sortType: "A" }] },
        viewport: `${id}-${basketConstituentsKey}`,
        table: basketConstituentSchema.table,
        columns: basketConstituentSchema.columns.map((col) => col.name),
        title,
      });
      saveSession?.(dataSourceBasketConstituents, basketConstituentsKey);
    }

    setBasketState({
      basketSchema,
      basketConstituentMap: buildColumnMap(basketConstituentSchema.columns),
      basketConstituentSchema,
      basketTradingMap: buildColumnMap(dataSourceBasketTradingControl.columns),
      basketTradingSchema,
      basketTradingConstituentJoinSchema,
      dataSourceBasketConstituents,
      dataSourceBasketTradingControl,
      dataSourceBasketTradingSearch,
      dataSourceBasketTradingConstituentJoin,
    });
  }, [
    VuuDataSource,
    basketInstanceId,
    getServerAPI,
    id,
    loadSession,
    saveSession,
    title,
  ]);

  const handleSendToMarket = useCallback(
    (basketInstanceId: string) => {
      basketState?.dataSourceBasketTradingControl
        .rpcRequest?.({
          params: { basketInstanceId },
          rpcName: "sendToMarket",
          type: "RPC_REQUEST",
        } as Omit<VuuRpcServiceRequest, "context">)
        .then((response) => {
          if (response?.type === "ERROR_RESULT") {
            showNotification({
              content: "Please contact your support team",
              header: "Failed to Send to market",
              level: "error",
              type: "toast",
            });
            console.error(response.errorMessage);
          }
        });
    },
    [basketState, showNotification],
  );

  const handleTakeOffMarket = useCallback(
    (basketInstanceId: string) => {
      basketState?.dataSourceBasketTradingControl
        .rpcRequest?.({
          params: { basketInstanceId },
          rpcName: "takeOffMarket",
          type: "RPC_REQUEST",
        } as Omit<VuuRpcServiceRequest, "context">)
        .then((response) => {
          if (response?.type === "ERROR_RESULT") {
            showNotification({
              content: "Please contact your support team",
              header: "Failed to take off market",
              level: "error",
              type: "toast",
            });
            console.error(response.errorMessage);
          }
        });
    },
    [basketState, showNotification],
  );

  // Note: we do not need to return the BasketConstituent dataSource, we just stash it
  // in session state from where it will be used by the AddInstrument button in Col
  // Header
  return {
    ...basketState,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
