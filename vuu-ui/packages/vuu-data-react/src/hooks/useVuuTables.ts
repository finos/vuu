import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { useData } from "@vuu-ui/core";
import { useEffect, useState } from "react";

export const useVuuTables = () => {
  const [tableSchemas, setTableSchemas] = useState<TableSchema[] | undefined>();

  const { getServerAPI } = useData();

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
  }, [getServerAPI]);

  return tableSchemas;
};
