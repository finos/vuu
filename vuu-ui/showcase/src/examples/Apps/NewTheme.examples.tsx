import { getAllSchemas } from "@finos/vuu-data-test";
import { TableSchema } from "@finos/vuu-data-types";
import { registerComponent } from "@finos/vuu-layout";
import { NotificationsProvider, useDialog } from "@finos/vuu-popups";
import {
  FeatureConfig,
  FeatureProps,
  LayoutManagementProvider,
  LeftNav,
  Shell,
  SidePanelProps,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { DragDropProvider } from "@finos/vuu-ui-controls";
import { FilterTableFeatureProps } from "feature-vuu-filter-table";
import { CSSProperties, useMemo } from "react";

import "./NewTheme.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "why-the-lucky-stiff", token: "test-token" };
const schemas = getAllSchemas();

let displaySequence = 1;

// Sort TableScheas by module
const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();
  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

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
  const { dialog } = useDialog();

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
      children: <LeftNav features={features} tableFeatures={tableFeatures} />,
      sizeOpen: 240,
    }),
    []
  );

  return (
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
      >
        {dialog}
      </Shell>
    </DragDropProvider>
  );
};

export const ShellWithNewThemeAndLayoutManagement = () => {
  document.cookie = `vuu-username=${user.username}`;

  return (
    <NotificationsProvider>
      <LayoutManagementProvider>
        <ShellWithNewTheme />
      </LayoutManagementProvider>
    </NotificationsProvider>
  );
};

ShellWithNewThemeAndLayoutManagement.displaySequence = displaySequence++;
