import { VuuDataSource } from "@finos/vuu-data-remote";
import {
  DataSource,
  DataSourceConfig,
  DataSourceFilter,
  TableSchema,
} from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { buildColumnMap, metadataKeys } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { InstrumentTile } from "./InstrumentTile";
import { InstrumentTileContainer } from "./InstrumentTileContainer";
import { useDataSource } from "./useDataSource";

import "./VuuInstrumentTilesFeature.css";
import { VuuRange } from "@finos/vuu-protocol-types";

const classBase = "VuuInstrumentTilesFeature";

export interface InstrumentTilesFeatureProps {
  instrumentPricesSchema: TableSchema;
}

const { KEY } = metadataKeys;

const VuuInstrumentTilesFeature = ({
  instrumentPricesSchema,
}: InstrumentTilesFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();

  const instrumentKeys = useMemo(
    () => ["AAA.L", "AAV.L", "ABB.MC", "ABK.N", "CDQ.L"],
    [],
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

    [instrumentKeys],
  );

  const handleDataSourceConfigChange = useCallback(
    (
      config: DataSourceConfig | undefined,
      _range: VuuRange,
      confirmed?: boolean,
    ) => {
      if (confirmed !== false) {
        save?.(config, "datasource-config");
      }
    },
    [save],
  );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as VuuDataSource;
    if (ds) {
      console.log({ ds });
      return ds;
    }

    ds = new VuuDataSource({
      bufferSize: 200,
      viewport: id,
      table: instrumentPricesSchema.table,
      columns: instrumentPricesSchema.columns.map((col) => col.name),
      filterSpec: filter,
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
    instrumentPricesSchema.columns,
    instrumentPricesSchema.table,
    title,
  ]);

  const instruments = useDataSource({
    dataSource,
    instruments: instrumentKeys,
  });

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns],
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
