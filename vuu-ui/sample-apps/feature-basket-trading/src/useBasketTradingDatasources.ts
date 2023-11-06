import { useViewContext } from "@finos/vuu-layout";
import { DataSource, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";
import { VuuFilter } from "packages/vuu-protocol-types";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent"
  | "data-source-instruments";

export const useBasketTradingDataSources = ({
  basketSchema,
  basketInstanceId,
  basketTradingSchema,
  basketTradingConstituentSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps & { basketInstanceId: string }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketTrading,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
  ] = useMemo(() => {
    const basketFilter: VuuFilter = {
      filter: `instanceId = "${basketInstanceId}"`,
    };
    const dataSourceConfig: [basketDataSourceKey, TableSchema, VuuFilter?][] = [
      ["data-source-basket", basketSchema],
      ["data-source-basket-trading", basketTradingSchema, basketFilter],
      ["data-source-basket-trading-control", basketTradingSchema],
      ["data-source-basket-trading-search", basketTradingSchema, basketFilter],
      [
        "data-source-basket-trading-constituent",
        basketTradingConstituentSchema,
        basketFilter,
      ],
      ["data-source-instruments", instrumentsSchema],
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema, filter] of dataSourceConfig) {
      console.log(`filter for ${key} = ${JSON.stringify(filter)}`);
      let dataSource = loadSession?.(key) as RemoteDataSource;
      if (dataSource === undefined) {
        dataSource = new RemoteDataSource({
          bufferSize: 100,
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
    basketTradingConstituentSchema,
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
    dataSourceBasketTrading,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
