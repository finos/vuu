import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  FeatureAndLayoutProvider,
  LeftNav,
  SettingsSchema,
  Shell,
  SidePanelProps,
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
import { sysLayouts } from "../_test-data/sysLayoutMetadata";

import "./SampleApp.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const user = { username: "why-the-lucky-stiff", token: "test-token" };

const getFeaturePath: GetFeaturePaths = ({
  env,
  fileName,
  withCss = env === "production",
}) => {
  if (env === "production") {
    const url = `/features/${fileName}.feature.js`;
    return {
      url,
      css: withCss ? `/features/${fileName}.feature.css` : undefined,
    };
  } else {
    return {
      url: `/src/features/${fileName}.feature`,
    };
  }
};

const featurePaths: Record<string, DynamicFeatureProps> = {
  FilterTableFeature: getFeaturePath({ env, fileName: "FilterTable" }),
  InstrumentTiles: getFeaturePath({ env, fileName: "InstrumentTiles" }),
  BasketTrading: getFeaturePath({ env, fileName: "BasketTrading" }),
};

const dynamicFeatures: DynamicFeatureDescriptor[] = [
  {
    title: "Vuu Filter Table",
    name: "filter-table",
    ...featurePaths.FilterTableFeature,
    featureProps: {
      vuuTables: "*",
    },
    leftNavLocation: "vuu-tables",
  },
  {
    title: "Instrument Price Tiles",
    name: "instrument-tiles",
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
    ...featurePaths.BasketTrading,
    viewProps: {
      header: false,
    },
    leftNavLocation: "vuu-features",
  },
];

const userSettingsSchema: SettingsSchema = {
  properties: [
    {
      name: "themeMode",
      label: "Mode",
      values: ["light", "dark"],
      defaultValue: "light",
      type: "string",
    },
    {
      name: "showAppStatusBar",
      label: "Show Application Status Bar",
      defaultValue: false,
      type: "boolean",
    },
  ],
};

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

  const SidePanelProps = useMemo<SidePanelProps>(
    () => ({
      children: <LeftNav />,
      sizeOpen: 240,
    }),
    [],
  );

  return (
    <FeatureAndLayoutProvider
      dynamicFeatures={dynamicFeatures}
      systemLayouts={sysLayouts}
    >
      <DragDropProvider dragSources={dragSource}>
        <Shell
          shellLayoutProps={{
            SidePanelProps,
            layoutTemplateId: "full-height",
          }}
          user={user}
          style={
            {
              "--vuuShell-height": "100vh",
              "--vuuShell-width": "100vw",
            } as CSSProperties
          }
          userSettingsSchema={userSettingsSchema}
        ></Shell>
      </DragDropProvider>
    </FeatureAndLayoutProvider>
  );
};

export const SampleAppDefaultFeatures = () => {
  document.cookie = `vuu-username=${user.username}`;
  return (
    <LocalDataSourceProvider>
      <SampleApp />
    </LocalDataSourceProvider>
  );
};
