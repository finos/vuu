import { VuuTableMetaWithTable } from "@finos/vuu-protocol-types";
import { useCallback, useEffect, useState } from "react";
import { getServerAPI } from "../connection-manager";
import { createSchemaFromTableMetadata, TableSchema } from "../message-utils";

export const useVuuTables = () => {
  const [tables, setTables] = useState<Map<string, TableSchema> | undefined>();

  const buildTables = useCallback((schemas: VuuTableMetaWithTable[]) => {
    const vuuTables = new Map<string, TableSchema>();
    schemas.forEach((schema) => {
      vuuTables.set(schema.table.table, createSchemaFromTableMetadata(schema));
    });
    return vuuTables;
  }, []);

  useEffect(() => {
    async function fetchTableMetadata() {
      const server = await getServerAPI();
      const { tables } = await server.getTableList();
      const tableSchemas = buildTables(
        await Promise.all(
          tables.map((tableDescriptor) => server.getTableMeta(tableDescriptor))
        )
      );
      setTables(tableSchemas);
    }

    fetchTableMetadata();
  }, [buildTables]);

  return tables;
};
