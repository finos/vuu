import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { SetPropsAction, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { MenuActionClosePopup } from "@finos/vuu-popups";
import { DataSource } from "@finos/vuu-data";
import { useMemo } from "react";

export const useBasketContextMenus = ({
  dataSourceBasketConstituent,
}: {
  dataSourceBasketConstituent: DataSource;
}) => {
  const dispatchLayoutAction = useLayoutProviderDispatch();

  return useMemo<[MenuBuilder, MenuActionHandler]>(() => {
    return [
      (location, options) => {
        console.log({ location, options });
        const locations = location.split(" ");
        const menuDescriptors: ContextMenuItemDescriptor[] = [];
        if (locations.includes("basket-design")) {
          menuDescriptors.push({
            label: "Add Instrument",
            action: "add-instrument",
            options,
          });
        }
        return menuDescriptors;
      },
      (action: MenuActionClosePopup) => {
        console.log("menu action", {
          action,
        });
        if (action.menuId === "add-instrument") {
          dispatchLayoutAction({
            type: "set-props",
            path: "#context-panel",
            props: {
              expanded: true,
              content: {
                type: "InstrumentSearch",
                props: {
                  TableProps: {
                    allowDragDrop: "drag-copy",
                    id: "basket-instruments",
                  },
                  dataSource: dataSourceBasketConstituent,
                },
              },
              title: "Add Ticker",
            },
          } as SetPropsAction);
        }
        return false;
      },
    ];
  }, [dataSourceBasketConstituent, dispatchLayoutAction]);
};
