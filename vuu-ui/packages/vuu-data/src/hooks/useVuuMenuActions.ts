import {
  VuuLink,
  VuuMenu,
  VuuMenuContext,
  VuuMenuItem,
} from "@finos/vuu-protocol-types";
import { useCallback, useRef } from "react";
import {
  ConfigChangeHandler,
  DataSource,
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinksMessage,
} from "../data-source";
import { LinkWithLabel } from "../server-proxy/server-proxy";
import { RpcResponse } from "../vuuUIMessageTypes";

export const addRowsFromInstruments = "addRowsFromInstruments";

export type VuuContextMenuDescriptor = {
  action: string;
  label: string;
  options?: unknown;
};

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

const CONFIG_ACTIONS = [
  "VIEW_PORT_MENUS_RESP",
  "VP_VISUAL_LINKS_RESP",
  "CREATE_VISUAL_LINK_SUCCESS",
  "REMOVE_VISUAL_LINK_SUCCESS",
];

export interface ViewServerHookResult {
  buildViewserverMenuOptions: any;
  dispatchGridAction: any;
  handleMenuAction: any;
}

export interface VuuMenuActionHookProps {
  /** The Vuu Menu returned for the current Viewport  */
  vuuMenu?: VuuMenu;
  dataSource: DataSource;
  onConfigChange?: ConfigChangeHandler;
  onRpcResponse?: (response: RpcResponse) => void;
  /** The VisualLink currently in force  */
  visualLink?: DataSourceVisualLinkCreatedMessage;
  /** All available visual links */
  visualLinks?: VuuLink[];
}

export const useVuuMenuActions = ({
  dataSource,
  onConfigChange,
  onRpcResponse,
  visualLink,
  visualLinks,
  vuuMenu,
}: VuuMenuActionHookProps): ViewServerHookResult => {
  const contextMenu = useRef(vuuMenu);

  const buildVuuMenuOptions = useCallback(
    (location, options) => {
      const { selectedRowCount = 0 } = options;
      const descriptors: VuuContextMenuDescriptor[] = [];

      if (visualLinks && !visualLink) {
        visualLinks.forEach((linkDescriptor: LinkWithLabel) => {
          const { link, label: linkLabel } = linkDescriptor;
          const label = linkLabel ? linkLabel : link.toTable;
          descriptors.push({
            label: `Link to ${label}`,
            action: "link-table",
            options: linkDescriptor,
          });
        });
      }

      if (contextMenu.current) {
        contextMenu.current.menus
          .sort(byContext)
          .forEach(({ name, filter, rpcName, context }) => {
            if (
              contextCompatibleWithLocation(location, context, selectedRowCount)
            ) {
              descriptors.push({
                label: name,
                action: "MENU_RPC_CALL",
                options: {
                  context,
                  filter,
                  rpcName,
                },
              });
            }
          });
      }

      return descriptors;
    },
    [visualLink, visualLinks]
  );

  const dispatchGridAction = useCallback(
    (
      action:
        | DataSourceVisualLinkCreatedMessage
        | DataSourceMenusMessage
        | DataSourceVisualLinksMessage
    ) => {
      if (CONFIG_ACTIONS.includes(action.type)) {
        if (action.type === "VIEW_PORT_MENUS_RESP") {
          contextMenu.current = action.menu;
        }
        return onConfigChange?.(action), true;
      }
    },
    [onConfigChange]
  );

  const handleMenuAction = useCallback(
    (type, options) => {
      if (type === "MENU_RPC_CALL") {
        dataSource.menuRpcCall({ type, ...options }).then((result) => {
          onRpcResponse && onRpcResponse(result as RpcResponse);
        });
        return true;
      } else if (type === "link-table") {
        // the createLink method only exists on dataSource
        return dataSource.createLink(options), true;
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type`
        );
      }
    },
    [dataSource, onRpcResponse]
  );

  return {
    buildViewserverMenuOptions: buildVuuMenuOptions,
    dispatchGridAction,
    handleMenuAction,
  };
};
