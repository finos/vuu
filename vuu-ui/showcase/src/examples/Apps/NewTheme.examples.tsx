import { byModule } from "@finos/vuu-data";
import {
  registerComponent,
  useLayoutContextMenuItems,
} from "@finos/vuu-layout";
import { ContextMenuProvider, useDialog } from "@finos/vuu-popups";
import {
  FeatureConfig,
  FeatureProps,
  LayoutManagementProvider,
  LeftNav,
  Shell,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { CSSProperties } from "react";
import { FilterTableFeatureProps } from "feature-vuu-filter-table";
import { getAllSchemas } from "@finos/vuu-data-test";

import "./NewTheme.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "test-user", token: "test-token" };
const schemas = getAllSchemas();

let displaySequence = 1;

type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };
type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePaths: Record<Environment, PathMap> = {
  development: {
    FilterTableFeature: {
      url: "/src/features/FilterTable.feature",
    },
    InstrumentTiles: {
      url: "/src/features/InstrumentTiles.feature",
    },
    BasketTrading: {
      url: "/src/features/BasketTrading.feature",
    },
  },
  production: {
    FilterTableFeature: {
      url: "/features/FilterTable.feature.js",
      css: "/features/FilterTable.feature.css",
    },
    InstrumentTiles: {
      url: "/features/InstrumentTiles.feature.js",
      css: "/features/InstrumentTiles.feature.css",
    },
    BasketTrading: {
      url: "/features/BasketTrading.feature.js",
      css: "/features/BasketTrading.feature.css",
    },
  },
};

const features: FeatureProps[] = [
  {
    title: "Instrument Price Tiles",
    ...featurePaths[env].InstrumentTiles,
    ComponentProps: {
      tableSchema: schemas.instrumentPrices,
    },
  },
  {
    title: "Basket Trading",
    ...featurePaths[env].BasketTrading,
    ComponentProps: {
      basketSchema: schemas.basket,
      basketTradingSchema: schemas.basketTrading,
      basketTradingConstituentJoinSchema: schemas.basketTradingConstituentJoin,
      instrumentsSchema: schemas.instruments,
    },
  },
];

const tableFeatures: FeatureProps<FilterTableFeatureProps>[] = Object.values(
  schemas
)
  .sort(byModule)
  .map((schema) => ({
    ComponentProps: {
      tableSchema: schema,
    },
    title: `${schema.table.module} ${schema.table.table}`,
    ...featurePaths[env].FilterTableFeature,
  }));

const ShellWithNewTheme = () => {
  const { dialog, setDialogState } = useDialog();
  const { buildMenuOptions, handleMenuAction } =
    useLayoutContextMenuItems(setDialogState);

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <Shell
        LayoutProps={{
          pathToDropTarget: "#main-tabs.ACTIVE_CHILD",
        }}
        leftSidePanelLayout="full-height"
        leftSidePanel={
          <LeftNav
            features={features}
            tableFeatures={tableFeatures}
            style={{ width: 240 }}
          />
        }
        loginUrl={window.location.toString()}
        user={user}
        style={
          {
            "--vuuShell-height": "100vh",
            "--vuuShell-width": "100vw",
          } as CSSProperties
        }
      >
        {dialog}
      </Shell>
    </ContextMenuProvider>
  );
};

export const ShellWithNewThemeAndLayoutManagement = () => {
  return (
    <LayoutManagementProvider>
      <ShellWithNewTheme />
    </LayoutManagementProvider>
  );
};

ShellWithNewThemeAndLayoutManagement.displaySequence = displaySequence++;
