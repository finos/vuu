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
  const columnMap = buildColumnMap(basketSchema.columns);
  const [basketName, setBasketName] = useState("");
  const [basketId, setBasketId] = useState<string>();
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const saveBasket = useCallback(() => {
    if (basketName && basketId) {
      onSaveBasket(basketName, basketId);
      if (basketDataSource?.menu) {
        const rpcCommand = getRpcCommand(
          basketDataSource?.menu?.menus,
          "CREATE_NEW_BASKET"
        );
        if (rpcCommand) {
          basketDataSource
            .rpcCall?.({
              namedParams: {},
              params: [basketId, basketName],
              rpcName: "createBasket",
              type: "VIEW_PORT_RPC_CALL",
            })
            .then((response) => {
              console.log(`rpcResponse`, { response });
            });
        }
      } else {
        throw Error(
          "useNewBasketPanel cannot create basket, datasource has no menu"
        );
      }
    }
  }, [basketDataSource, basketId, basketName, onSaveBasket]);

  const handleSelectBasket = useCallback<TableRowSelectHandler>(
    (row) => {
      const basketId = row[KEY] as string;
      console.log({ basketId, columnMap });
      setBasketId(basketId);
      setTimeout(() => {
        saveButtonRef.current?.focus();
      }, 60);
    },
    [columnMap]
  );

  const handleChangeBasketName = useCallback<Commithandler<string>>(
    (evt, value) => {
      setBasketName(value);
      return Promise.resolve(true);
    },
    []
  );

  const handleOpenChangeInstrumentPicker = useCallback<OpenChangeHandler>(
    (open) => {
      if (!open) {
        basketDataSource.disable?.();
      }
    },
    [basketDataSource]
  );

  return {
    columnMap,
    onChangeBasketName: handleChangeBasketName,
    onCloseInstrumentPicker: handleOpenChangeInstrumentPicker,
    onOpenChangeInstrumentPicker: handleOpenChangeInstrumentPicker,
    onSave: saveBasket,
    onSelectBasket: handleSelectBasket,
    saveButtonDisabled: basketName === "" || basketId === undefined,
    saveButtonRef,
  };
};
