import {
  FeatureAndLayoutProvider,
  FeatureList,
  type GroupedFeatureProps,
  useFeatures,
} from "@vuu-ui/vuu-shell";
import { DataProvider } from "@vuu-ui/core";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { getAllSchemas } from "@vuu-ui/vuu-data-test";
import {
  type DynamicFeatureDescriptor,
  type StaticFeatureDescriptor,
  hasFilterTableFeatureProps,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const appSchemas = Object.values(getAllSchemas());
const getAppServerAPI = async () => ({
  getTableList: async () => ({
    tables: appSchemas.map(({ table }) => table),
  }),
  getTableSchema: async (table: (typeof appSchemas)[number]["table"]) => {
    const schema = appSchemas.find(
      ({ table: candidate }) =>
        candidate.module === table.module && candidate.table === table.table,
    );
    if (!schema) {
      throw new Error(`Unknown table ${table.module}:${table.table}`);
    }
    return schema;
  },
  rpcCall: async () => {
    throw new Error("RPC is not supported by this fixture");
  },
});

const staticFeatures: StaticFeatureDescriptor[] = [
  { label: "label1", type: "Placeholder" },
  { label: "label2", type: "Component" },
  { label: "label3", type: "Placeholder" },
  { label: "label4", type: "View" },
  { label: "label5", type: "Placeholder" },
];

const StaticFeaturesTemplate = () => {
  const { staticFeatures = [] } = useFeatures();
  return (
    <>
      <FeatureList features={staticFeatures} />
    </>
  );
};

export const DefaultStaticFeatures = () => {
  return (
    <FeatureAndLayoutProvider
      dynamicFeatures={[]}
      staticFeatures={staticFeatures}
    >
      <StaticFeaturesTemplate />
    </FeatureAndLayoutProvider>
  );
};

const appVuuExampleFeatures: DynamicFeatureDescriptor[] = [
  {
    description: "Vuu Filter Table",
    featureProps: { vuuTables: "*" },
    id: "filter-table",
    leftNavLocation: "vuu-tables",
    location: "vuu-features",
    mfComponent: "default",
    mfScope: "filter-table",
    mfUrl: "../feature-filter-table/index.js",
    name: "filter-table",
    path: "filter-table",
    title: "Vuu Filter Table",
    version: 1,
  },
  {
    description: "Instrument Price Tiles",
    featureProps: {
      vuuTables: [{ module: "SIMUL", table: "instrumentPrices" }],
    },
    id: "instrument-tiles",
    leftNavLocation: "vuu-features",
    location: "vuu-features",
    mfComponent: "default",
    mfScope: "instrument-tiles",
    mfUrl: "../feature-instrument-tiles/index.js",
    name: "instrument-tiles",
    path: "instrument-tiles",
    title: "Instrument Price Tiles",
    version: 1,
  },
];

const AppVuuExampleFeatureLists = () => {
  const { dynamicFeatures = [], tableFeatures = [] } = useFeatures();
  const groupedTableFeatures = useMemo(
    () =>
      tableFeatures.reduce<GroupedFeatureProps>(
        (groups, feature) => {
          if (hasFilterTableFeatureProps(feature)) {
            const module = feature.ComponentProps.tableSchema.table.module;
            (groups[`${module} Tables`] ??= []).push(feature);
          }
          return groups;
        },
        {},
      ),
    [tableFeatures],
  );

  return (
    <div>
      <FeatureList
        data-testid="app-vuu-dynamic-features"
        features={dynamicFeatures}
        title="VUU FEATURES"
      />
      <FeatureList
        data-testid="app-vuu-table-features"
        features={groupedTableFeatures}
        title="VUU TABLES"
      />
    </div>
  );
};

export const AppVuuExampleFeatures = () => (
  <DataProvider
    VuuDataSource={VuuDataSource}
    getServerAPI={getAppServerAPI}
    isLocalData={false}
  >
    <FeatureAndLayoutProvider dynamicFeatures={appVuuExampleFeatures}>
      <AppVuuExampleFeatureLists />
    </FeatureAndLayoutProvider>
  </DataProvider>
);
