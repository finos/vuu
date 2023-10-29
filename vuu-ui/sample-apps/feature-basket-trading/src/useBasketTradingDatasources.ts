import { useViewContext } from "@finos/vuu-layout";
import { DataSource, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent"
  | "data-source-instruments";

export const useBasketTradingDataSources = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketTrading,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
  ] = useMemo(() => {
    const dataSourceConfig: [basketDataSourceKey, TableSchema][] = [
      ["data-source-basket", basketSchema],
      ["data-source-basket-trading", basketTradingSchema],
      ["data-source-basket-trading-search", basketTradingSchema],
      [
        "data-source-basket-trading-constituent",
        basketTradingConstituentSchema,
      ],
      ["data-source-instruments", instrumentsSchema],
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema] of dataSourceConfig) {
      let dataSource = loadSession?.(key) as RemoteDataSource;
      if (dataSource === undefined) {
        dataSource = new RemoteDataSource({
          bufferSize: 200,
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
    basketTradingConstituentSchema,
    id,
    instrumentsSchema,
    loadSession,
    saveSession,
    title,
  ]);

  const handleSendToMarket = useCallback(() => {
    setActiveTabIndex(1);
  }, []);

  const handleTakeOffMarket = useCallback(() => {
    setActiveTabIndex(0);
  }, []);

  const saveNewBasket = useCallback((basketName: string, basketId: string) => {
    console.log(`save new baskert ${basketName}, ${basketId}`);
  }, []);

  return {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketTrading,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
    saveNewBasket,
  };
};
