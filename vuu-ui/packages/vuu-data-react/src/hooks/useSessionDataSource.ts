import {
  DataSource,
  DataSourceConfig,
  DataSourceConfigChangeHandler,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { isConfigChanged, useDataSource } from "@vuu-ui/vuu-utils";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { useCallback, useMemo } from "react";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";

type SessionDataSourceConfig = {
  "datasource-config"?: DataSourceConfig;
};

const NO_CONFIG: SessionDataSourceConfig = {};

export const useSessionDataSource = ({
  dataSourceSessionKey = "data-source",
  tableSchema,
}: {
  dataSourceSessionKey?: string;
  tableSchema: TableSchema;
}) => {
  const { id, load, save, loadSession, saveSession, title } = useViewContext();
  const { VuuDataSource } = useDataSource();

  const { "datasource-config": dataSourceConfigFromState } =
    useMemo<SessionDataSourceConfig>(() => load?.() ?? NO_CONFIG, [load]);

  const handleDataSourceConfigChange =
    useCallback<DataSourceConfigChangeHandler>(
      (
        config: DataSourceConfig | undefined,
        _range: VuuRange,
        confirmed?: boolean,
      ) => {
        if (confirmed !== false) {
          const { noChanges } = isConfigChanged(
            dataSourceConfigFromState,
            config,
          );
          if (noChanges === false) {
            save?.(config, "datasource-config");
          }
        }
      },
      [dataSourceConfigFromState, save],
    );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.(dataSourceSessionKey) as DataSource;
    if (ds) {
      if (dataSourceConfigFromState) {
        // this won't do anything if dataSource config already matches this
        // This is only really used when injecting a dataSource into session
        // state in Showcase examples
        // DO we definitely need this ? If not apply config can be provate
        ds.applyConfig(dataSourceConfigFromState, true);
      }

      if (ds.range.from > 0) {
        // UI does not currently restore scroll position, so always reset to top of dataset
        ds.range = ds.range.reset;
      }

      return ds;
    }

    const columns =
      dataSourceConfigFromState?.columns ??
      tableSchema.columns.map((col) => col.name);

    ds = new VuuDataSource({
      // bufferSize: 0,
      viewport: id,
      table: tableSchema.table,
      ...dataSourceConfigFromState,
      columns,
      title,
    });
    ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    VuuDataSource,
    dataSourceConfigFromState,
    dataSourceSessionKey,
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  return dataSource;
};
