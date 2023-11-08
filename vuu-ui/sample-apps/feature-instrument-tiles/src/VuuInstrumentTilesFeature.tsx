import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { buildColumnMap, metadataKeys } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { InstrumentTile } from "./InstrumentTile";
import { InstrumentTileContainer } from "./InstrumentTileContainer";
// import { useDataSource } from "@finos/vuu-data-react";
import { useDataSource } from "./useDataSource";

import "./VuuInstrumentTilesFeature.css";

const classBase = "VuuInstrumentTilesFeature";

export interface InstrumentTilesFeatureProps {
  tableSchema: TableSchema;
}

const { KEY } = metadataKeys;

const VuuInstrumentTilesFeature = ({
  tableSchema,
}: InstrumentTilesFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();

  const instrumentKeys = useMemo(
    () => ["AAA.L", "AAV.L", "ABB.MC", "ABK.N", "CDQ.L"],
    []
  );

  const filter: DataSourceFilter = useMemo(
    () => ({
      filter: `ric in [${instrumentKeys.map((i) => `"${i}"`).join(",")}]`,
      filterStruct: {
        op: "in",
        column: "ric",
        values: instrumentKeys,
      },
    }),

    [instrumentKeys]
  );

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
      filter,
      title,
    });
    ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    filter,
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  const instruments = useDataSource({
    dataSource,
    instruments: instrumentKeys,
  });

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns]
  );

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);

  return (
    <div className={classBase}>
      <InstrumentTileContainer>
        {instruments.map((instrument) => (
          <InstrumentTile
            columnMap={columnMap}
            instrument={instrument}
            key={instrument[KEY]}
          />
        ))}
      </InstrumentTileContainer>
    </div>
  );
};

export default VuuInstrumentTilesFeature;
