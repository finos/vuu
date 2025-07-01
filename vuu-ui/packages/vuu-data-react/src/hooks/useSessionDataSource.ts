import type {
  DataSource,
  DataSourceConfig,
  DataSourceConfigChangeHandler,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import type { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { isConfigChanged, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef } from "react";

type SessionState = {
  "datasource-config"?: DataSourceConfig;
};

const NO_CONFIG: SessionState = {};

export const useSessionDataSource = ({
  dataSourceSessionKey = "data-source",
  tableSchema,
}: {
  dataSourceSessionKey?: string;
  tableSchema: TableSchema;
}) => {
  const { id, load, save, loadSession, saveSession, title } = useViewContext();
  const { VuuDataSource } = useData();

  const { "datasource-config": dataSourceConfigFromState } =
    useMemo<SessionState>(() => load?.() ?? NO_CONFIG, [load]);

  const dataSourceConfigRef = useRef<DataSourceConfig | undefined>(
    dataSourceConfigFromState,
  );

  const handleDataSourceConfigChange =
    useCallback<DataSourceConfigChangeHandler>(
      (
        config: DataSourceConfig | undefined,
        _range: VuuRange,
        confirmed?: boolean,
      ) => {
        if (confirmed !== false) {
          const { noChanges } = isConfigChanged(
            dataSourceConfigRef.current,
            config,
          );
          if (noChanges === false) {
            dataSourceConfigRef.current = config;
            save?.(config, "datasource-config");
          }
        }
      },
      [save],
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
      ...dataSourceConfigRef.current,
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
