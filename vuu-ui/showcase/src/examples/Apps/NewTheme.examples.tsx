import { byModule } from "@finos/vuu-data";
import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { registerComponent } from "@finos/vuu-layout";
import {
  ContextMenuProvider,
  Dialog,
  MenuActionClosePopup,
} from "@finos/vuu-popups";
import {
  FeatureConfig,
  FeatureProps,
  LayoutManagementProvider,
  LayoutMetadata,
  LeftNav,
  SaveLayoutPanel,
  Shell,
  useLayoutManager,
} from "@finos/vuu-shell";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import {
  CSSProperties,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FilterTableFeatureProps } from "feature-vuu-filter-table";
import { schemas } from "../utils";

import "./NewTheme.examples.css";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "test-user", token: "test-token" };

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
      basketDefinitionsSchema: schemas.basketDefinitions,
      basketDesignSchema: schemas.basketDesign,
      basketOrdersSchema: schemas.basketOrders,
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
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  const { saveLayout } = useLayoutManager();

  const handleSave = useCallback(
    (layoutMetadata: Omit<LayoutMetadata, "id" | "created">) => {
      saveLayout(layoutMetadata);
      setDialogContent(undefined);
    },
    [saveLayout]
  );

  const [buildMenuOptions, handleMenuAction] = useMemo<
    [MenuBuilder, MenuActionHandler]
  >(() => {
    return [
      (location, options) => {
        console.log({ options });
        const locations = location.split(" ");
        const menuDescriptors: ContextMenuItemDescriptor[] = [];
        if (locations.includes("main-tab")) {
          menuDescriptors.push(
            {
              label: "Save Layout",
              action: "save-layout",
              options,
            },
            {
              label: "Layout Settings",
              action: "layout-settings",
              options,
            }
          );
        }
        return menuDescriptors;
      },
      (action: MenuActionClosePopup) => {
        console.log("menu action", {
          action,
        });
        if (action.menuId === "save-layout") {
          setDialogContent(
            <SaveLayoutPanel
              onCancel={handleCloseDialog}
              onSave={handleSave}
              componentId={action.options.controlledComponentId}
            />
          );
          return true;
        }
        return false;
      },
    ];
  }, [handleCloseDialog, handleSave]);

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
        <Dialog
          isOpen={dialogContent !== undefined}
          onClose={handleCloseDialog}
          style={{ maxHeight: 500, borderColor: "#6d188b" }}
          title={"Save Layout"}
          hideCloseButton
        >
          {dialogContent}
        </Dialog>
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
