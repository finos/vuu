import { VuuFeatureMessage } from "@finos/vuu-data";
import { isViewportMenusAction } from "@finos/vuu-data-react";
import {
  ClientToServerMenuRPC,
  VuuMenu,
  VuuMenuItem,
} from "@finos/vuu-protocol-types";
import { TableRowSelectHandler } from "@finos/vuu-table";
import { Commithandler, OpenChangeHandler } from "@finos/vuu-ui-controls";
import { buildColumnMap, metadataKeys } from "@finos/vuu-utils";
import { useCallback, useRef, useState } from "react";
import { NewBasketPanelProps } from "./NewBasketPanel";

const { KEY } = metadataKeys;

type Menu = VuuMenu | VuuMenuItem;
const isMenu = (menu: Menu): menu is VuuMenu => "menus" in menu;
const flatten = (menus: Menu[], menuItems: VuuMenuItem[] = []) => {
  menus.forEach((m) =>
    isMenu(m) ? flatten(m.menus, menuItems) : menuItems.push(m)
  );
  return menuItems;
};
const getRpcCommand = (menus: Menu[], selectRpcCommand?: string) => {
  const selectionMenuItems = flatten(menus).filter(
    (m) => m.context === "selected-rows"
  );
  if (selectRpcCommand) {
    return selectionMenuItems.find((m) => m.rpcName === selectRpcCommand);
  } else if (selectionMenuItems.length === 1) {
    return selectionMenuItems[0];
  }
};

export type NewBasketHookProps = Pick<
  NewBasketPanelProps,
  "basketDataSource" | "basketSchema" | "onSaveBasket"
>;

export const useNewBasketPanel = ({
  basketDataSource,
  basketSchema,
  onSaveBasket,
}: NewBasketHookProps) => {
  const rpcCommandRef = useRef<string | undefined>();
  const columnMap = buildColumnMap(basketSchema.columns);
  const [basketName, setBasketName] = useState("");
  const [basketId, setBasketId] = useState<string>();

  const saveBasket = useCallback(() => {
    if (basketName && basketId) {
      onSaveBasket(basketName, basketId);

      if (rpcCommandRef.current) {
        basketDataSource.menuRpcCall({
          rpcName: rpcCommandRef.current,
          type: "VIEW_PORT_MENUS_SELECT_RPC",
        } as Omit<ClientToServerMenuRPC, "vpId">);

        requestAnimationFrame(() => {
          basketDataSource.unsubscribe();
        });
      }
    }
  }, [basketDataSource, basketId, basketName, onSaveBasket]);

  const handleSelectBasket = useCallback<TableRowSelectHandler>(
    (row) => {
      const basketId = row[KEY] as string;
      console.log({ basketId, columnMap });
      setBasketId(basketId);
    },
    [columnMap]
  );

  const handleChangeBasketName = useCallback<Commithandler<string>>(
    (evt, value) => {
      setBasketName(value);
    },
    []
  );

  const handleFeatureEnabled = useCallback((message: VuuFeatureMessage) => {
    if (isViewportMenusAction(message)) {
      const {
        menu: { menus },
      } = message;
      const rpcCommand = getRpcCommand(menus, "CREATE_NEW_BASKET");
      console.log({ rpcCommand });
      rpcCommandRef.current = rpcCommand?.rpcName;
    }
  }, []);

  const handleOpenChangeInstrumentPicker = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      if (!open) {
        console.log(`instrument picker closed ${closeReason}`);
      }
    },
    []
  );

  return {
    columnMap,
    onChangeBasketName: handleChangeBasketName,
    onCloseInstrumentPicker: handleOpenChangeInstrumentPicker,
    onFeatureEnabled: handleFeatureEnabled,
    onOpenChangeInstrumentPicker: handleOpenChangeInstrumentPicker,
    onSave: saveBasket,
    onSelectBasket: handleSelectBasket,
    saveButtonDisabled: basketName === "" || basketId === undefined,
  };
};
