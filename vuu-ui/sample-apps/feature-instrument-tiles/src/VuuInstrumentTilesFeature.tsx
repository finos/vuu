import { useIdMemo } from "@salt-ds/core";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import {
  DataSource,
  DataSourceConfig,
  DataSourceFilter,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { buildColumnMap, metadataKeys } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { InstrumentTile } from "./InstrumentTile";
import { InstrumentTileContainer } from "./InstrumentTileContainer";
import { useDataSource } from "./useDataSource";

import "./VuuInstrumentTilesFeature.css";

const classBase = "VuuInstrumentTilesFeature";

export interface InstrumentTilesFeatureProps {
  instrumentPricesSchema: TableSchema;
}

const { KEY } = metadataKeys;

const VuuInstrumentTilesFeature = ({
  instrumentPricesSchema,
}: InstrumentTilesFeatureProps) => {
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
    () => ["AAA.L", "AAV.L", "ABB.MC", "ABK.N", "CDQ.L"],
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
