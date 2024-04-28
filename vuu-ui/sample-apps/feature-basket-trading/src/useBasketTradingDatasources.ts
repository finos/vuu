import { useViewContext } from "@finos/vuu-layout";
import { VuuDataSource } from "@finos/vuu-data-remote";
import {
  DataSource,
  DataSourceConfig,
  TableSchema,
  ViewportRpcResponse,
} from "@finos/vuu-data-types";
import { useCallback, useMemo } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { useNotifications } from "@finos/vuu-popups";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent-join"
  | "data-source-basket-constituent";

const NO_CONFIG = {};

export const useBasketTradingDataSources = ({
  basketConstituentSchema,
  basketSchema,
  basketInstanceId,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
}: BasketTradingFeatureProps & {
  basketInstanceId: string;
}) => {
  const notify = useNotifications();
  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
  ] = useMemo(() => {
    const basketFilter: DataSourceConfig = basketInstanceId
      ? {
          filter: {
            filter: `instanceId = "${basketInstanceId}"`,
          },
        }
      : NO_CONFIG;

    const constituentSort: DataSourceConfig = {
      sort: { sortDefs: [{ column: "description", sortType: "D" }] },
    };

    const dataSourceConfig: [
      basketDataSourceKey,
      TableSchema,
      number,
      DataSourceConfig?
    ][] = [
      ["data-source-basket", basketSchema, 100],
      [
        "data-source-basket-trading-control",
        basketTradingSchema,
        0,
        basketFilter,
      ],
      ["data-source-basket-trading-search", basketTradingSchema, 100],
      [
        "data-source-basket-trading-constituent-join",
        basketTradingConstituentJoinSchema,
        100,
        basketFilter,
      ],
      [
        "data-source-basket-constituent",
        basketConstituentSchema,
        100,
        constituentSort,
      ],
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema, bufferSize, config] of dataSourceConfig) {
      let dataSource = loadSession?.(key) as VuuDataSource;
      if (dataSource === undefined) {
        dataSource = new VuuDataSource({
          ...config,
          bufferSize,
          viewport: `${id}-${key}`,
          table: schema.table,
          columns: schema.columns.map((col) => col.name),
          title,
        });
        saveSession?.(dataSource, key);
      }
      dataSources.push(dataSource);
    }
    return dataSources;
  }, [
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    basketConstituentSchema,
    loadSession,
    id,
    title,
    saveSession,
  ]);

  const handleSendToMarket = useCallback(
    (basketInstanceId: string) => {
      dataSourceBasketTradingControl
        .rpcCall?.<ViewportRpcResponse>({
          namedParams: {},
          params: [basketInstanceId],
          rpcName: "sendToMarket",
          type: "VIEW_PORT_RPC_CALL",
        })
        .then((response) => {
          if (response?.action.type === "VP_RPC_FAILURE") {
            notify({
              type: "error",
              header: "Failed to Send to market",
              body: "Please contact your support team",
            });
            console.error(response.action.msg);
          }
        });
    },
    [dataSourceBasketTradingControl, notify]
  );

  const handleTakeOffMarket = useCallback(
    (basketInstanceId: string) => {
      dataSourceBasketTradingControl
        .rpcCall?.<ViewportRpcResponse>({
          namedParams: {},
          params: [basketInstanceId],
          rpcName: "takeOffMarket",
          type: "VIEW_PORT_RPC_CALL",
        })
        .then((response) => {
          if (response?.action.type === "VP_RPC_FAILURE") {
            notify({
              type: "error",
              header: "Failed to take off market",
              body: "Please contact your support team",
            });
            console.error(response.action.msg);
          }
        });
    },
    [dataSourceBasketTradingControl, notify]
  );

  // Note: we do not need to return the BasketConstituent dataSource, we just stash it
  // in session state from where it will be used by the AddInstrument button in Col
  // Header
  return {
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
