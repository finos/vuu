import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { useViewContext } from "@finos/vuu-layout";
import { useCallback, useEffect, useMemo } from "react";

import "./VuuBasketTradingFeature.css";

const classBase = "VuuBasketTradingFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

const VuuBasketTradingFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();

  console.log("Instrument Prices", {
    tableSchema,
  });

  const handleDataSourceConfigChange = useCallback(
    (config: DataSourceConfig | undefined, confirmed?: boolean) => {
      // confirmed / unconfirmed messages are used for UI updates, not state saving
      if (confirmed === undefined) {
        save?.(config, "datasource-config");
      }
    },
    [save]
  );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }

    ds = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: tableSchema.table,
      columns: tableSchema.columns.map((col) => col.name),
      title,
    });
    ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);

  return <div className={classBase}>Basket Trading</div>;
};

export default VuuBasketTradingFeature;
