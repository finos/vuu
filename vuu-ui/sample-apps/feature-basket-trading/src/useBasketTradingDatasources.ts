import { useViewContext } from "@finos/vuu-layout";
import { DataSource, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";

export type basketDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-definitions"
  | "data-source-basket-definitions-search"
  | "data-source-basket-design"
  | "data-source-basket-orders"
  | "data-source-instruments";

export const useBasketTradingDataSources = ({
  basketSchema,
  basketDefinitionsSchema,
  basketDesignSchema,
  basketOrdersSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketDefinitions,
    dataSourceBasketDefinitionsSearch,
    dataSourceBasketDesign,
    dataSourceBasketOrders,
    dataSourceInstruments,
  ] = useMemo(() => {
    const dataSourceConfig: [basketDataSourceKey, TableSchema][] = [
      ["data-source-basket", basketSchema],
      ["data-source-basket-definitions", basketDefinitionsSchema],
      ["data-source-basket-definitions-search", basketDefinitionsSchema],
      ["data-source-basket-design", basketDesignSchema],
      ["data-source-basket-orders", basketOrdersSchema],
      ["data-source-instruments", instrumentsSchema],
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema] of dataSourceConfig) {
      let dataSource = loadSession?.(key) as RemoteDataSource;
      if (dataSource === undefined) {
        dataSource = new RemoteDataSource({
          bufferSize: 200,
          viewport: id,
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
    basketDefinitionsSchema,
    basketDesignSchema,
    basketOrdersSchema,
    basketSchema,
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
    dataSourceBasketDefinitions,
    dataSourceBasketDefinitionsSearch,
    dataSourceBasketDesign,
    dataSourceBasketOrders,
    dataSourceInstruments,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
    saveNewBasket,
  };
};
