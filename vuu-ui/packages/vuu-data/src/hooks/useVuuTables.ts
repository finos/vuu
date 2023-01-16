import {
  VuuColumnDataType,
  VuuTable,
  VuuTableMeta,
} from "@finos/vuu-protocol-types";
import { useCallback, useEffect, useState } from "react";
import { useServerConnection } from "./useServerConnection";

export type SchemaColumn = {
  name: string;
  serverDataType: VuuColumnDataType;
};

export type TableSchema = {
  columns: SchemaColumn[];
  table: VuuTable;
};

const createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  table,
}: VuuTableMeta): TableSchema => {
  return {
    table,
    columns: columns.map((col, idx) => ({
      name: col,
      serverDataType: dataTypes[idx],
    })),
  };
};

export const useVuuTables = () => {
  const [tables, setTables] = useState<Map<string, TableSchema> | undefined>();
  const server = useServerConnection(undefined);

  const buildTables = useCallback((schemas: VuuTableMeta[]) => {
    const vuuTables = new Map<string, TableSchema>();
    schemas.forEach((schema) => {
      vuuTables.set(schema.table.table, createSchemaFromTableMetadata(schema));
    });
    return vuuTables;
  }, []);

  useEffect(() => {
    async function fetchTableMetadata() {
      if (server) {
        const { tables } = await server.getTableList();
        const tableSchemas = buildTables(
          await Promise.all(
            tables.map((tableDescriptor) =>
              server.getTableMeta(tableDescriptor)
            )
          )
        );
        setTables(tableSchemas);
      }
    }

    if (server) {
      fetchTableMetadata();
    }
  }, [buildTables, server]);

  return tables;
};
