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
  },
  production: {
    TableNextFeature: {
      url: "/features/TableNext.feature.js",
      css: "/features/TableNext.feature.css",
    },
  },
};

const features: FeatureProps<TableNextFeatureProps>[] = Object.values(schemas)
  .sort(byModule)
  .map((schema) => ({
    ComponentProps: {
      schema,
    },
    title: `${schema.table.module} ${schema.table.table}`,
    ...featurePaths[env].TableNextFeature,
  }));

console.log({ features });

const ShellWithNewTheme = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement>();

  const handleCloseDialog = useCallback(() => {
    setDialogContent(undefined);
  }, []);

  const { saveLayout } = useLayoutManager();

  const handleSave = useCallback(
    (layoutMetadata: Omit<LayoutMetadata, "id">) => {
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
            features={[]}
            tableFeatures={features}
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
