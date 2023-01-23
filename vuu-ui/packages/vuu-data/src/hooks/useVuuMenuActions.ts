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
  ConfigChangeHandler,
  DataSource,
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinksMessage,
} from "../data-source";
import { MenuRpcResponse } from "../vuuUIMessageTypes";
import { useViewContext } from "@finos/vuu-layout";

export const addRowsFromInstruments = "addRowsFromInstruments";

type DataSourceVuuMenuMessage =
  | DataSourceVisualLinkCreatedMessage
  | DataSourceMenusMessage
  | DataSourceVisualLinksMessage;

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

// Actions that inform state - state that we want to persist
const CONFIG_ACTIONS = [
  "VIEW_PORT_MENUS_RESP",
  "VP_VISUAL_LINKS_RESP",
  "CREATE_VISUAL_LINK_SUCCESS",
  "REMOVE_VISUAL_LINK_SUCCESS",
];

export interface ViewServerHookResult {
  buildViewserverMenuOptions: any;
  dispatchGridAction: (action: DataSourceVuuMenuMessage) => boolean;
  handleMenuAction: (type: string, options: unknown) => boolean;
}

export interface VuuMenuActionHookProps {
  dataSource: DataSource;
  onConfigChange?: ConfigChangeHandler;
  onRpcResponse?: (response?: MenuRpcResponse) => void;
}

export const useVuuMenuActions = ({
  dataSource,
  onConfigChange,
  onRpcResponse,
}: VuuMenuActionHookProps): ViewServerHookResult => {
  const { load, loadSession, saveSession } = useViewContext();

  const buildVuuMenuOptions = useCallback(
    (location, options) => {
      const { selectedRowCount = 0 } = options;
      const descriptors: ContextMenuItemDescriptor[] = [];
      const visualLinks = loadSession?.(
        "visual-links"
      ) as LinkDescriptorWithLabel[];
      const vuuMenu = loadSession?.("vs-context-menu") as VuuMenu;
      const visualLink = load?.(
        "visual-link"
      ) as DataSourceVisualLinkCreatedMessage;

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
    [load, loadSession]
  );

  const dispatchGridAction = useCallback(
    (action: DataSourceVuuMenuMessage) => {
      if (CONFIG_ACTIONS.includes(action.type)) {
        if (action.type === "VIEW_PORT_MENUS_RESP") {
          saveSession?.(action.menu, "vs-context-menu");
        } else if (action.type === "VP_VISUAL_LINKS_RESP") {
          saveSession?.(action.links, "visual-links");
        }
        return onConfigChange?.(action), true;
      }
      return false;
    },
    [onConfigChange, saveSession]
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
        return dataSource.createLink(options as LinkDescriptorWithLabel), true;
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
    dispatchGridAction,
    handleMenuAction,
  };
};
