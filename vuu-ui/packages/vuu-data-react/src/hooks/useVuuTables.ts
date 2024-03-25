import { getServerAPI } from "@finos/vuu-data-remote";
import { TableSchema } from "@finos/vuu-data-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useCallback, useEffect, useState } from "react";

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
      try {
        const server = await getServerAPI();
        const { tables } = await server.getTableList();
        const tableSchemas = buildTables(
          await Promise.all(
            tables.map((vuuTable) => server.getTableSchema(vuuTable))
          )
        );
        setTables(tableSchemas);
      } catch (err) {
        console.warn(
          `useVuuTables: unable to connect to Vuu server ${String(err)}`
        );
      }
    }

    fetchTableMetadata();
  }, [buildTables]);

  return tables;
};

export const getVuuTableSchema = (table: VuuTable) =>
  getServerAPI().then((server) => server.getTableSchema(table));
