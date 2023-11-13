import { useCallback, useEffect, useState } from "react";
import { getServerAPI, TableSchema } from "@finos/vuu-data";

export const useVuuTables = () => {
  const [tables, setTables] = useState<Map<string, TableSchema> | undefined>();

  const buildTables = useCallback((schemas: TableSchema[]) => {
    const vuuTables = new Map<string, TableSchema>();
    schemas.forEach((schema) => {
      vuuTables.set(schema.table.table, schema);
    });
    return vuuTables;
  }, []);

  useEffect(() => {
    async function fetchTableMetadata() {
      const server = await getServerAPI();
      const { tables } = await server.getTableList();
      const tableSchemas = buildTables(
        await Promise.all(
          tables.map((vuuTable) => server.getTableSchema(vuuTable))
        )
      );
      setTables(tableSchemas);
    }

    fetchTableMetadata();
  }, [buildTables]);

  return tables;
};
