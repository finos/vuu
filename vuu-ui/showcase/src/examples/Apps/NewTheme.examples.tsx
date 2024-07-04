import { getAllSchemas } from "@finos/vuu-data-test";
import {
  FeatureProps,
  LeftNav,
  LocalPersistenceManager,
  PersistenceProvider,
  Shell,
  SidePanelProps,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { DragDropProvider } from "@finos/vuu-ui-controls";
import {
  GetFeaturePaths,
  env,
  getFilterTableFeatures,
  registerComponent,
} from "@finos/vuu-utils";
import { CSSProperties, useMemo } from "react";

import "./NewTheme.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "why-the-lucky-stiff", token: "test-token" };
const schemas = getAllSchemas();

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

const featurePaths: Record<string, FeatureProps> = {
  FilterTableFeature: getFeaturePath({ env, fileName: "FilterTable" }),
  InstrumentTiles: getFeaturePath({ env, fileName: "InstrumentTiles" }),
  BasketTrading: getFeaturePath({ env, fileName: "BasketTrading" }),
};

const features: FeatureProps[] = [
  {
    title: "Instrument Price Tiles",
    ...featurePaths.InstrumentTiles,
    ComponentProps: {
      tableSchema: schemas.instrumentPrices,
    },
  },
  {
    title: "Basket Trading",
    ...featurePaths.BasketTrading,
    ViewProps: {
      header: false,
    },
    ComponentProps: {
      basketSchema: schemas.basket,
      basketTradingSchema: schemas.basketTrading,
      basketTradingConstituentJoinSchema: schemas.basketTradingConstituentJoin,
      basketConstituentSchema: schemas.basketConstituent,
    },
  },
];

const filterTableFeatures = getFilterTableFeatures(
  Object.values(schemas),
  getFeaturePath
);

const ShellWithNewTheme = () => {
  const localPersistenceManager = useMemo(
    () => new LocalPersistenceManager(`vuu/${user.username}`),
    []
  );
  const dragSource = useMemo(
    () => ({
      "basket-instruments": {
        dropTargets: "basket-constituents",
        payloadType: "key",
      },
    }),
    []
  );

  const leftSidePanelProps = useMemo<SidePanelProps>(
    () => ({
      children: (
        <LeftNav features={features} tableFeatures={filterTableFeatures} />
      ),
      sizeOpen: 240,
    }),
    []
  );

  return (
    <PersistenceProvider persistenceManager={localPersistenceManager}>
      <DragDropProvider dragSources={dragSource}>
        <Shell
          LayoutProps={{
            pathToDropTarget: "#main-tabs.ACTIVE_CHILD",
          }}
          LeftSidePanelProps={leftSidePanelProps}
          leftSidePanelLayout="full-height"
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
    </PersistenceProvider>
  );
};

export const ShellWithNewThemeAndLayoutManagement = () => {
  document.cookie = `vuu-username=${user.username}`;

  return <ShellWithNewTheme />;
};

ShellWithNewThemeAndLayoutManagement.displaySequence = displaySequence++;
