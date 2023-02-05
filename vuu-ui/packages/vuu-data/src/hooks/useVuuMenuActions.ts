import { GridAction } from "@finos/vuu-datagrid-types";
import { ContextMenuItemDescriptor } from "@finos/vuu-popups";
import {
  LinkDescriptorWithLabel,
  VuuMenu,
  VuuMenuContext,
  VuuMenuItem,
  VuuMenuRpcRequest,
} from "@finos/vuu-protocol-types";
import { useCallback } from "react";
import {
  DataSource,
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "../data-source";
import { MenuRpcResponse } from "../vuuUIMessageTypes";

export const addRowsFromInstruments = "addRowsFromInstruments";

const NO_CONFIG: MenuActionConfig = {};

const contextSortPriorities = {
  "selected-rows": 0,
  cell: 1,
  row: 2,
  grid: 3,
};

const byContext = (menu1: VuuMenuItem, menu2: VuuMenuItem) => {
  return (
    contextSortPriorities[menu1.context] - contextSortPriorities[menu2.context]
  );
};

export const isVisualLinksAction = (
  action: GridAction
): action is DataSourceVisualLinksMessage => action.type === "vuu-links";

export const isVisualLinkCreatedAction = (
  action: GridAction
): action is DataSourceVisualLinkCreatedMessage =>
  action.type === "vuu-link-created";

export const isVisualLinkRemovedAction = (
  action: GridAction
): action is DataSourceVisualLinkRemovedMessage =>
  action.type === "REMOVE_VISUAL_LINK_SUCCESS";

export const isViewportMenusAction = (
  action: GridAction
): action is DataSourceMenusMessage => action.type === "vuu-menu";

export const isVuuFeatureAction = (
  action: GridAction
): action is VuuFeatureMessage =>
  isViewportMenusAction(action) || isVisualLinksAction(action);

export const isVuuFeatureInvocation = (
  action: GridAction
): action is VuuFeatureInvocationMessage =>
  action.type === "vuu-link-created" || action.type === "vuu-link-removed";

const contextCompatibleWithLocation = (
  location: "grid" | "header" | "filter",
  context: VuuMenuContext,
  selectedRowCount: number
) => {
  switch (location) {
    case "grid":
      if (context === "selected-rows") {
        return selectedRowCount > 0;
      } else {
        return true;
      }
    case "header":
      return context === "grid";
    default:
      return false;
  }
};

const getMenuType = (context: VuuMenuContext) => {
  switch (context) {
    case "selected-rows":
      return "VIEW_PORT_MENUS_SELECT_RPC";
    case "row":
      return "VIEW_PORT_MENU_ROW_RPC";
    case "cell":
      return "VIEW_PORT_MENU_CELL_RPC";
    case "grid":
      return "VIEW_PORT_MENU_TABLE_RPC";
    default:
      throw Error("No RPC command for ${msgType} / ${context}");
  }
};

const getMenuRpcRequest = ({ context, rpcName }: VuuMenuItem) => {
  return {
    rpcName,
    type: getMenuType(context),
  } as Omit<VuuMenuRpcRequest, "vpId">;
};

export interface ViewServerHookResult {
  buildViewserverMenuOptions: any;
  // dispatchGridAction: (action: DataSourceVuuMenuMessage) => boolean;
  handleMenuAction: (type: string, options: unknown) => boolean;
}

export interface MenuActionConfig {
  vuuMenu?: VuuMenu;
  visualLink?: DataSourceVisualLinkCreatedMessage;
  visualLinks?: LinkDescriptorWithLabel[];
}

export interface VuuMenuActionHookProps {
  dataSource: DataSource;
  menuActionConfig?: MenuActionConfig;
  // onConfigChange?: ConfigChangeHandler;
  onRpcResponse?: (response?: MenuRpcResponse) => void;
}

export const useVuuMenuActions = ({
  dataSource,
  menuActionConfig = NO_CONFIG,
  // onConfigChange,
  onRpcResponse,
}: VuuMenuActionHookProps): ViewServerHookResult => {
  const buildVuuMenuOptions = useCallback(
    (location, options) => {
      const { visualLink, visualLinks, vuuMenu } = menuActionConfig;
      const { selectedRowCount = 0 } = options;
      const descriptors: ContextMenuItemDescriptor[] = [];

      if (visualLinks && !visualLink) {
        visualLinks.forEach((linkDescriptor: LinkDescriptorWithLabel) => {
          const { link, label: linkLabel } = linkDescriptor;
          const label = linkLabel ? linkLabel : link.toTable;
          descriptors.push({
            label: `Link to ${label}`,
            action: "link-table",
            options: linkDescriptor,
          });
        });
      }

      if (vuuMenu) {
        vuuMenu.menus.sort(byContext).forEach((menu) => {
          if (
            contextCompatibleWithLocation(
              location,
              menu.context,
              selectedRowCount
            )
          ) {
            descriptors.push({
              label: menu.name,
              action: "MENU_RPC_CALL",
              options: menu,
            });
          }
        });
      }

      return descriptors;
    },
    [menuActionConfig]
  );

  const handleMenuAction = useCallback(
    (type: string, options: unknown) => {
      if (type === "MENU_RPC_CALL") {
        const rpcRequest = getMenuRpcRequest(options as VuuMenuItem);
        dataSource.menuRpcCall(rpcRequest).then((rpcResponse) => {
          onRpcResponse && onRpcResponse(rpcResponse);
        });
        return true;
      } else if (type === "link-table") {
        // return dataSource.createLink(options as LinkDescriptorWithLabel), true;
        return (
          (dataSource.visualLink = options as LinkDescriptorWithLabel), true
        );
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type ${type}`
        );
      }
      return false;
    },
    [dataSource, onRpcResponse]
  );

  return {
    buildViewserverMenuOptions: buildVuuMenuOptions,
    // dispatchGridAction,
    handleMenuAction,
  };
};
