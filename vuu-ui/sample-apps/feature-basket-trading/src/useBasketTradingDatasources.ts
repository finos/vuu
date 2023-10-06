import { useViewContext } from "@finos/vuu-layout";
import { RemoteDataSource } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { BasketTradingFeatureProps } from "./VuuBasketTradingFeature";

export const useBasketTradingDataSources = ({
  basketDefinitionsSchema,
  basketDesignSchema,
  basketOrdersSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { id, save, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceBasket,
    dataSourceBasketSearch,
    dataSourceBasketDesign,
    dataSourceBasketOrders,
    dataSourceInstruments,
  ] = useMemo(() => {
    // prettier-ignore
    let ds1 = loadSession?.("basket-definitions") as RemoteDataSource;
    let ds2 = loadSession?.("basket-definitions-search") as RemoteDataSource;
    // prettier-ignore
    let ds3 = loadSession?.("basket-design-data-source") as RemoteDataSource;
    let ds4 = loadSession?.("basket-orders-data-source") as RemoteDataSource;
    let ds5 = loadSession?.("instruments-data-source") as RemoteDataSource;
    if (ds1 && ds2 && ds3 && ds4 && ds5) {
      console.log("all datasources found in session state");
      return [ds1, ds2, ds3, ds4, ds5];
    }

    ds1 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDefinitionsSchema.table,
      columns: basketDefinitionsSchema.columns.map((col) => col.name),
      title,
    });
    ds2 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDefinitionsSchema.table,
      columns: basketDefinitionsSchema.columns.map((col) => col.name),
      title,
    });
    ds3 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDesignSchema.table,
      columns: basketDesignSchema.columns.map((col) => col.name),
      title,
    });
    ds4 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketOrdersSchema.table,
      columns: basketOrdersSchema.columns.map((col) => col.name),
      title,
    });
    ds5 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: instrumentsSchema.table,
      columns: instrumentsSchema.columns.map((col) => col.name),
      title,
    });
    // ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds1, "basket-definitions");
    saveSession?.(ds2, "basket-definitions-search");
    saveSession?.(ds3, "basket-design-data-source");
    saveSession?.(ds4, "basket-orders-data-source");
    saveSession?.(ds5, "instruments-data-source");
    return [ds1, ds2, ds3, ds4, ds5];
  }, [
    basketDefinitionsSchema.columns,
    basketDefinitionsSchema.table,
    basketDesignSchema.columns,
    basketDesignSchema.table,
    basketOrdersSchema.columns,
    basketOrdersSchema.table,
    id,
    instrumentsSchema.columns,
    instrumentsSchema.table,
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

  return {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketSearch,
    dataSourceBasketDesign,
    dataSourceBasketOrders,
    dataSourceInstruments,
    onSendToMarket: handleSendToMarket,
    onTakeOffMarket: handleTakeOffMarket,
  };
};
