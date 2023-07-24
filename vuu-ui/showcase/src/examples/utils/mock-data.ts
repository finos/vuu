import { TableSchema } from "@finos/vuu-data";
import { FeatureConfig, Features } from "@finos/vuu-shell";
import { useMemo } from "react";
import { useSchemas } from "./useSchemas";

type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };

// This simulates the 'Features' loaded dynamically by the Vuu Shell.
// See showcase/src/features for the implementations. The Features
// are loaded from source in dev mode and from a pre-built bundle
// in prod mode, hence the two sets of config below.
// Features are dynamically loaded components which can consume Vuu
// table data.
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
      schemaMap.set(name, schema);
    }
    return schemaMap;
  }, [vuuSchemas]);

  return {
    features: MOCK_FEATURES,
    schemas,
  };
};
