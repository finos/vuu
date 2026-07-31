import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils2";
import { useEffect, useId, useMemo, useState } from "react";

const MODULES_TABLE = {
  module: "MODULE_DISCOVERY",
  table: "modules",
} as const;

type ModuleAdminState =
  | { status: "loading" }
  | { error: Error; status: "error" }
  | {
      config: TableConfig;
      dataSource: DataSource;
      status: "ready";
    };

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export const useModuleAdmin = (): ModuleAdminState => {
  const { getServerAPI } = useData();
  const { getDataSource } = useSessionDataSource();
  const instanceId = useId();
  const [schema, setSchema] = useState<TableSchema>();
  const [dataSource, setDataSource] = useState<DataSource>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let active = true;

    const loadSchema = async () => {
      try {
        const serverAPI = await getServerAPI();
        const nextSchema = await serverAPI.getTableSchema(MODULES_TABLE);
        if (active) {
          setSchema(nextSchema);
        }
      } catch (cause) {
        if (active) {
          const nextError = toError(cause);
          console.error(
            "ModuleAdmin failed to discover the modules schema",
            cause,
          );
          setError(nextError);
        }
      }
    };

    void loadSchema();

    return () => {
      active = false;
    };
  }, [getServerAPI]);

  useEffect(() => {
    if (!schema) return;

    try {
      const sessionKey = `feature-module-admin-${instanceId}-module-discovery-modules`;
      setDataSource(
        getDataSource(sessionKey, {
          bufferSize: 200,
          columns: schema.columns.map(({ name }) => name),
          table: schema.table,
          viewport: sessionKey,
        }),
      );
    } catch (cause) {
      const nextError = toError(cause);
      console.error(
        "ModuleAdmin failed to create the modules data source",
        cause,
      );
      setError(nextError);
    }
  }, [getDataSource, instanceId, schema]);

  const config = useMemo<TableConfig | undefined>(
    () =>
      schema
        ? {
            columnLayout: "fit",
            columns: [...schema.columns],
            rowSeparators: true,
            zebraStripes: true,
          }
        : undefined,
    [schema],
  );

  if (error) {
    return { error, status: "error" };
  }

  if (!config || !dataSource) {
    return { status: "loading" };
  }

  return { config, dataSource, status: "ready" };
};
