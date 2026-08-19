import { useIdMemo } from "@salt-ds/core";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type {
  DataSource,
  DataSourceConfig,
  DataSourceFilter,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import type { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { buildColumnMap, metadataKeys, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InstrumentTile } from "./InstrumentTile";
import { InstrumentTileContainer } from "./InstrumentTileContainer";
import { useDataSource } from "./useDataSource";

import "./VuuInstrumentTilesFeature.css";

const classBase = "VuuInstrumentTilesFeature";

const { KEY } = metadataKeys;

const InstrumentTiles = ({
  instrumentPricesSchema,
}: {
  instrumentPricesSchema: TableSchema;
}) => {
  const { id, save, title } = useViewContext();

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

  const { getDataSource } = useSessionDataSource({
    onConfigChange: handleDataSourceConfigChange,
  });
  const instrumentKeys = useMemo(
    () => ["AAOO.L", "AAPZ.AS", "ABB.MC", "ABK.N", "CDQ.L"],
    [],
  );

  const sessionKey = useIdMemo(id);

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

  const dataSource: DataSource = useMemo(() => {
    return getDataSource(sessionKey, {
      bufferSize: 200,
      viewport: id,
      table: instrumentPricesSchema.table,
      columns: instrumentPricesSchema.columns.map((col) => col.name),
      filterSpec: filter,
      title,
    });
  }, [
    filter,
    getDataSource,
    id,
    instrumentPricesSchema.columns,
    instrumentPricesSchema.table,
    sessionKey,
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
    <InstrumentTileContainer>
      {instruments.map((instrument) => (
        <InstrumentTile
          columnMap={columnMap}
          instrument={instrument}
          key={instrument[KEY]}
        />
      ))}
    </InstrumentTileContainer>
  );
};

const VuuInstrumentTilesFeature = () => {
  const { getServerAPI } = useData();
  const [instrumentPricesSchema, setInstrumentPricesSchema] =
    useState<TableSchema>();

  useEffect(() => {
    getServerAPI()
      .then((serverAPI) =>
        serverAPI.getTableSchema({
          module: "SIMUL",
          table: "instrumentPrices",
        }),
      )
      .then(setInstrumentPricesSchema);
  }, [getServerAPI]);

  return (
    <div className={classBase}>
      {instrumentPricesSchema ? (
        <InstrumentTiles instrumentPricesSchema={instrumentPricesSchema} />
      ) : null}
    </div>
  );
};

export default VuuInstrumentTilesFeature;
