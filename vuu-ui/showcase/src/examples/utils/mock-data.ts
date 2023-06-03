import { TableSchema } from "@finos/vuu-data";
import { FeatureConfig, Features } from "@finos/vuu-shell";
import { useMemo } from "react";
import { useSchemas } from "./useSchemas";

type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };

const componentPaths: { [key: string]: PathMap } = {
  development: {
    VuuBlotterMockData: {
      url: "/src/features/VuuBlotterMockData.feature",
    },
  },
  production: {
    VuuBlotterMockData: {
      url: "/features/VuuBlotterMockData.feature.js",
      css: "/features/VuuBlotterMockData.feature.css",
    },
  },
};

type Environment = keyof typeof componentPaths;
const env = process.env.NODE_ENV as Environment;

const MOCK_FEATURES: Features = {
  vuuTableMockData: {
    name: "vuuTableMockData",
    title: "Vuu Table (mock test data)",
    ...componentPaths[env]["VuuBlotterMockData"],
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
