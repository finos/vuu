import type {
  DataSource,
  SessionDataSourceOverrides,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";

export interface UseImportSchemaProps {
  dataSource: DataSource;
  importSchema?: TableSchema;
  importTable?: VuuTable;
}

export interface UseImportSchemaResult {
  resolvedImportSchema: TableSchema | undefined;
  schema: TableSchema | undefined;
  sessionOverrides: SessionDataSourceOverrides | undefined;
}

export const useImportSchema = ({
  dataSource,
  importSchema,
  importTable,
}: UseImportSchemaProps): UseImportSchemaResult => {
  const { getServerAPI } = useData();
  const [fetchedImportSchema, setFetchedImportSchema] = useState<
    TableSchema | undefined
  >();

  useEffect(() => {
    if (importSchema || importTable === undefined) {
      setFetchedImportSchema(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const server = await getServerAPI();
        const tableSchema = await server.getTableSchema(importTable);
        if (!cancelled) {
          setFetchedImportSchema(tableSchema);
        }
      } catch (error) {
        console.error(
          "[useImportSchema] failed to fetch import table schema",
          error,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getServerAPI, importSchema, importTable]);

  const resolvedImportSchema = importSchema ?? fetchedImportSchema;

  const sessionOverrides = useMemo<SessionDataSourceOverrides | undefined>(() => {
    const columns = resolvedImportSchema?.columns.map(({ name }) => name);
    return columns || importTable ? { columns, table: importTable } : undefined;
  }, [resolvedImportSchema, importTable]);

  // CSV is validated before the session table exists, so the import schema cannot
  // come from the session datasource. Never fall back to the target schema once an
  // import table is declared - that would validate against the wrong columns.
  const schema = importTable
    ? resolvedImportSchema
    : (resolvedImportSchema ?? dataSource.tableSchema);

  return {
    resolvedImportSchema,
    schema,
    sessionOverrides,
  };
};
