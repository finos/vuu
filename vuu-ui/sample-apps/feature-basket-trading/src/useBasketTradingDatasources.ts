import { useViewContext } from "@finos/vuu-layout";
import {
  DataSource,
  RemoteDataSource,
  TableSchema,
  ViewportRpcResponse,
} from "@finos/vuu-data";
import { useCallback, useMemo } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { NotificationLevel, useNotifications } from "@finos/vuu-popups";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent-join"
  | "data-source-basket-constituent";

const NO_FILTER = { filter: "" };

export const useBasketTradingDataSources = ({
  basketSchema,
  basketInstanceId,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  basketConstituentSchema,
}: BasketTradingFeatureProps & { basketInstanceId: string }) => {
  const { notify } = useNotifications();
  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceBasketConstituent,
  ] = useMemo(() => {
    const basketFilter: VuuFilter = basketInstanceId
      ? {
          filter: `instanceId = "${basketInstanceId}"`,
        }
      : NO_FILTER;
    const dataSourceConfig: [
      basketDataSourceKey,
      TableSchema,
      number,
      VuuFilter?
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
      ["data-source-basket-constituent", basketConstituentSchema, 100],
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema, bufferSize, filter] of dataSourceConfig) {
      let dataSource = loadSession?.(key) as RemoteDataSource;
      if (dataSource === undefined) {
        dataSource = new RemoteDataSource({
          bufferSize,
          filter,
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
    basketSchema,
    basketTradingSchema,
    basketInstanceId,
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
              type: NotificationLevel.Error,
              header: "Failed to Send to market",
              body: "Please contact your support team",
            });
            console.error(response.action.msg);
          }
        });
    },
    [dataSourceBasketTradingControl, notify]
  );

  const handleTakeOffMarket = useCallback(() => {
    console.log("take off market");
  }, []);

  return {
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceBasketConstituent,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
