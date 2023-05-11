import { TableSchema } from "@finos/vuu-data";
import { Features } from "@finos/vuu-shell";
import { useMemo } from "react";
import { useSchemas } from "./useSchemas";

const MOCK_FEATURES: Features = {
  vuuTableMockData: {
    name: "vuuTableMockData",
    title: "Vuu Table (mock test data)",
    url: "../../../../showcase/src/examples/VuuFeatures/VuuBlotter/VuuBlotterMockData",
  },
  vuuDataGrid: {
    name: "vuuDataGrid",
    title: "Vuu DataGrid",
    url: "../../../../showcase/src/examples/VuuFeatures/VuuBlotter/VuuBlotter",
  },
  vuuTable: {
    name: "vuuTable",
    title: "Vuu Table",
    url: "../../../../showcase/src/examples/VuuFeatures/VuuBlotter/VuuBlotter",
  },
};

export const useMockFeatureData = () => {
  const { schemas: vuuSchemas } = useSchemas();

  const schemas = useMemo(() => {
    const schemaMap = new Map<string, TableSchema>();

    for (const [name, schema] of Object.entries(vuuSchemas)) {
      schemaMap.set(name, {
        table: schema.table,
        columns: schema.columns.map((col) => ({
          name: col.name,
          serverDataType: col.serverDataType ?? "string",
        })),
      });
    }

    return schemaMap;
  }, [vuuSchemas]);

  return {
    features: MOCK_FEATURES,
    schemas,
  };
};
