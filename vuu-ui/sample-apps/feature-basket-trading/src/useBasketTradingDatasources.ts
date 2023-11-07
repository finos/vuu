import { useViewContext } from "@finos/vuu-layout";
import { DataSource, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { VuuFilter } from "@finos/vuu-protocol-types";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent-join"
  | "data-source-instruments";

const NO_FILTER = { filter: "" };

export const useBasketTradingDataSources = ({
  basketSchema,
  basketInstanceId,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps & { basketInstanceId: string }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceInstruments,
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
      ["data-source-instruments", instrumentsSchema, 100],
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
    instrumentsSchema,
    loadSession,
    id,
    title,
    saveSession,
  ]);

  const handleSendToMarket = useCallback(() => {
    setActiveTabIndex(1);
  }, []);

  const handleTakeOffMarket = useCallback(() => {
    setActiveTabIndex(0);
  }, []);

  return {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceInstruments,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
