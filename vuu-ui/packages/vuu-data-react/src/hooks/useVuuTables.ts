import type { TableSchema } from "@finos/vuu-data-types";
import { useDataSource } from "@finos/vuu-utils";
import { useCallback, useEffect, useState } from "react";

export const useVuuTables = () => {
  const [tables, setTables] = useState<Map<string, TableSchema> | undefined>();

  const { getServerAPI } = useDataSource();

  const buildTables = useCallback((schemas: TableSchema[]) => {
    const vuuTables = new Map<string, TableSchema>();
    schemas.forEach((schema) => {
      vuuTables.set(schema.table.table, schema);
    });
    return vuuTables;
  }, []);

  useEffect(() => {
    async function fetchTableMetadata() {
      try {
        const server = await getServerAPI();
        const { tables } = await server.getTableList();
        const tableSchemas = buildTables(
          await Promise.all(
            tables.map((vuuTable) => server.getTableSchema(vuuTable)),
          ),
        );
        setTables(tableSchemas);
      } catch (err) {
        console.warn(
          `useVuuTables: error fetching table metedata ${String(err)}`,
        );
      }
    }

    fetchTableMetadata();
  }, [buildTables, getServerAPI]);

  return tables;
};
