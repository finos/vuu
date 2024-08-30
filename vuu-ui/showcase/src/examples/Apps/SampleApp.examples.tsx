import { LocalDataSourceProvider } from "@finos/vuu-data-test/src/local-datasource-provider/LocalDatasourceProvider";
import {
  FeatureAndLayoutProvider,
  LeftNav,
  Shell,
  SidePanelProps,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { DragDropProvider } from "@finos/vuu-ui-controls";
import {
  DynamicFeatureDescriptor,
  DynamicFeatureProps,
  GetFeaturePaths,
  env,
  registerComponent,
} from "@finos/vuu-utils";
import { CSSProperties, useMemo } from "react";
import { sysLayouts } from "../_test-data/sysLayoutMetadata";

import "./SampleApp.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "why-the-lucky-stiff", token: "test-token" };

let displaySequence = 1;

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
      schema: "*",
    },
    leftNavLocation: "vuu-tables",
  },
  {
    title: "Instrument Price Tiles",
    name: "instrument-tiles",
    ...featurePaths.InstrumentTiles,
    featureProps: {
      schemas: [
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
    featureProps: {
      schemas: [
        {
          module: "BASKET",
          table: "basket",
        },
        {
          module: "BASKET",
          table: "basketTrading",
        },
        {
          module: "BASKET",
          table: "basketTradingConstituentJoin",
        },
        {
          module: "BASKET",
          table: "basketConstituent",
        },
      ],
    },
    leftNavLocation: "vuu-features",
  },
];

const ShellWithNewTheme = () => {
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
    <LocalDataSourceProvider modules={["BASKET", "SIMUL"]}>
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
            loginUrl={window.location.toString()}
            user={user}
            style={
              {
                "--vuuShell-height": "100vh",
                "--vuuShell-width": "100vw",
              } as CSSProperties
            }
          ></Shell>
        </DragDropProvider>
      </FeatureAndLayoutProvider>
    </LocalDataSourceProvider>
  );
};

export const SampleAppDefaultFeatures = () => {
  document.cookie = `vuu-username=${user.username}`;
  return <ShellWithNewTheme />;
};

SampleAppDefaultFeatures.displaySequence = displaySequence++;
