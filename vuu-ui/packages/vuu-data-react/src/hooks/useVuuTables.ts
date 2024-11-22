import type { TableSchema } from "@finos/vuu-data-types";
import { useDataSource } from "@finos/vuu-utils";
import { useCallback, useEffect, useState } from "react";

export const useVuuTables = () => {
  const [tableSchemas, setTableSchemas] = useState<TableSchema[] | undefined>();

  const { getServerAPI } = useDataSource();

  const buildTables = useCallback((schemas: TableSchema[]) => {
    const vuuTables = new Map<string, TableSchema>();
    schemas.forEach((schema) => {
      const { module, table } = schema.table;
      vuuTables.set(`${module}:${table}`, schema);
    });
    return vuuTables;
  }, []);

  useEffect(() => {
    async function fetchTableMetadata() {
      try {
        const server = await getServerAPI();
        const { tables } = await server.getTableList();
        const tableSchemas = await Promise.all(
          tables.map((vuuTable) => server.getTableSchema(vuuTable)),
        );
        setTableSchemas(tableSchemas);
      } catch (err) {
        console.warn(
          `useVuuTables: error fetching table metadata ${String(err)}`,
        );
      }
    }

    fetchTableMetadata();
  }, [buildTables, getServerAPI]);

  return tableSchemas;
};
