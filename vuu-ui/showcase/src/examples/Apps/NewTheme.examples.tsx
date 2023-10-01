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
import { TableNextFeatureProps } from "showcase/src/features/TableNext.feature";
import { schemas } from "../utils";
import { TableNextFeatureAsFeature as FilterTable } from "../VuuFeatures/TableNextFeature.examples";

import "./NewTheme.examples.css";

registerComponent("FilterTable", FilterTable, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
registerComponent("TableSettings", TableSettingsPanel, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

type PathMap = { [key: string]: Pick<FeatureConfig, "css" | "url"> };
type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePaths: Record<Environment, PathMap> = {
  development: {
    TableNextFeature: {
      url: "/src/features/TableNext.feature",
    },
    InstrumentTiles: {
      url: "/src/features/InstrumentTiles.feature",
    },
    BasketTrading: {
      url: "/src/features/BasketTrading.feature",
    },
  },
  production: {
    TableNextFeature: {
      url: "/features/TableNext.feature.js",
      css: "/features/TableNext.feature.css",
    },
  },
};

const features: FeatureProps[] = [
  {
    title: "Instrument Price Tiles",
    ...featurePaths[env].InstrumentTiles,
    ComponentProps: {
      tableSchema: schemas.instruments,
    },
  },
  {
    title: "Basket Trading",
    ...featurePaths[env].BasketTrading,
    ComponentProps: {
      basketDesignSchema: schemas.basketDesign,
    },
  },
];

const tableFeatures: FeatureProps<TableNextFeatureProps>[] = Object.values(
  schemas
)
  .sort(byModule)
  .map((schema) => ({
    ComponentProps: {
      schema,
    },
    title: `${schema.table.module} ${schema.table.table}`,
    ...featurePaths[env].TableNextFeature,
  }));

const ShellWithNewTheme = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  const { saveLayout } = useLayoutManager();

  const handleSave = useCallback(
    (layoutMetadata: Omit<LayoutMetadata, "id">) => {
      console.log(
        `Save layout as ${layoutMetadata.name} to group ${layoutMetadata.group}`
      );
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

  //TODO what the App actually receives is an array of layouts
  const layout = useMemo(() => {
    return {
      type: "Stack",
      id: "main-tabs",
      props: {
        className: "vuuShell-mainTabs",
        TabstripProps: {
          allowAddTab: true,
          allowRenameTab: true,
          animateSelectionThumb: false,
          location: "main-tab",
        },
        preserve: true,
        active: 0,
      },
      children: [
        {
          type: "Stack",
          props: {
            active: 0,
            title: "My Instruments",
            TabstripProps: {
              allowRenameTab: true,
              allowCloseTab: true,
            },
          },
          children: [
            {
              type: "View",
              props: {
                title: "European Stock",
              },
              style: { height: "calc(100% - 6px)" },
              children: [
                {
                  type: "FilterTable",
                },
              ],
            },
            {
              type: "View",
              props: {
                title: "Other Stock",
              },
              style: { height: "calc(100% - 6px)" },
              children: [
                {
                  type: "FilterTable",
                },
              ],
            },
          ],
        },
      ],
    };
  }, []);

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <Shell
        LayoutProps={{
          pathToDropTarget: "#main-tabs.ACTIVE_CHILD",
        }}
        defaultLayout={layout}
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
        saveLocation="local"
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
          headerProps={{ className: "dialogHeader" }}
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
