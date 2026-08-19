import { AuthenticationProvider } from "@vuu-ui/core";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  FeatureAndLayoutProvider,
  LocalWorkspacePersistenceService,
  PersistenceProvider,
  Shell,
} from "@vuu-ui/vuu-shell";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { DragDropProvider } from "@vuu-ui/vuu-ui-controls";
import {
  DynamicFeatureDescriptor,
  DynamicFeatureProps,
  GetFeaturePaths,
  env,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { CSSProperties, useMemo } from "react";

import "./SampleApp.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const user = { username: "why-the-lucky-stiff", token: "test-token" };

const getFeaturePath: GetFeaturePaths = ({ fileName }) => ({
  mfComponent: `features/${fileName}`,
  mfScope: "showcase_examples",
  mfUrl: "/showcase-examples",
});

const featurePaths: Record<string, DynamicFeatureProps> = {
  FilterTableFeature: getFeaturePath({ env, fileName: "FilterTable" }),
  InstrumentTiles: getFeaturePath({ env, fileName: "InstrumentTiles" }),
  BasketTrading: getFeaturePath({ env, fileName: "BasketTrading" }),
};

const dynamicFeatures: DynamicFeatureDescriptor[] = [
  {
    title: "Vuu Filter Table",
    name: "filter-table",
    description: "Vuu Filter Table",
    id: "filter-table",
    location: "vuu-features",
    path: "filter-table",
    version: 1,
    ...featurePaths.FilterTableFeature,
    featureProps: {
      vuuTables: "*",
    },
    leftNavLocation: "vuu-tables",
  },
  {
    title: "Instrument Price Tiles",
    name: "instrument-tiles",
    description: "Instrument Price Tiles",
    id: "instrument-tiles",
    location: "vuu-features",
    path: "instrument-tiles",
    version: 1,
    ...featurePaths.InstrumentTiles,
    featureProps: {
      vuuTables: [
        {
          module: "SIMUL",
          table: "instrumentPrices",
        },
      ],
    },
    leftNavLocation: "vuu-features",
  },
  {
    title: "Basket Trading",
    name: "basket-trading",
    description: "Basket Trading",
    id: "basket-trading",
    location: "vuu-features",
    path: "basket-trading",
    version: 1,
    ...featurePaths.BasketTrading,
    viewProps: {
      header: false,
    },
    leftNavLocation: "vuu-features",
  },
];


const SampleApp = () => {
  const dragSource = useMemo(
    () => ({
      "basket-instruments": {
        dropTargets: "basket-constituents",
        payloadType: "key",
      },
    }),
    [],
  );

  const persistenceService = useMemo(
    () =>
      new LocalWorkspacePersistenceService({
        applicationNamespace: "vuu-showcase",
        applicationId: "sample-app",
        userId: user.username,
      }),
    [],
  );

  return (
    <PersistenceProvider workspacePersistenceService={persistenceService}>
      <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
        <DragDropProvider dragSources={dragSource}>
          <Shell
            leftNavWidth={240}
            style={
              {
                "--vuuShell-height": "100vh",
                "--vuuShell-width": "100vw",
              } as CSSProperties
            }
          ></Shell>
        </DragDropProvider>
      </FeatureAndLayoutProvider>
    </PersistenceProvider>
  );
};

export const SampleAppDefaultFeatures = () => {
  document.cookie = `vuu-username=${user.username}`;
  return (
    <AuthenticationProvider mode="local" user={{ userName: user.username }}>
      <LocalDataSourceProvider>
        <SampleApp />
      </LocalDataSourceProvider>
    </AuthenticationProvider>
  );
};
