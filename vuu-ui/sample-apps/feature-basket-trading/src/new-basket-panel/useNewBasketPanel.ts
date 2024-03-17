import { ViewportRpcResponse } from "@finos/vuu-data-types";
import { Commithandler, OpenChangeHandler } from "@finos/vuu-ui-controls";
import { buildColumnMap } from "@finos/vuu-utils";
import { TableRowSelectHandler } from "packages/vuu-table-types";
import { useCallback, useRef, useState } from "react";
import { NewBasketPanelProps } from "./NewBasketPanel";

export type NewBasketHookProps = Pick<
  NewBasketPanelProps,
  "basketDataSource" | "basketSchema" | "onBasketCreated"
>;

export const useNewBasketPanel = ({
  basketDataSource,
  basketSchema,
  onBasketCreated,
}: NewBasketHookProps) => {
  const columnMap = buildColumnMap(basketSchema.columns);
  const [basketName, setBasketName] = useState("");
  const [basketId, setBasketId] = useState<string>();
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const saveBasket = useCallback(() => {
    if (basketName && basketId) {
      basketDataSource
        .rpcCall?.<ViewportRpcResponse>({
          namedParams: {},
          params: [basketId, basketName],
          rpcName: "createBasket",
          type: "VIEW_PORT_RPC_CALL",
        })
        .then((response) => {
          if (response?.action.type === "VP_CREATE_SUCCESS") {
            if (response?.action.key) {
              onBasketCreated(basketName, basketId, response.action.key);
            }
          } else if (response?.action.type === "VP_RPC_FAILURE") {
            // notify?.({
            //   type: NotificationLevel.Error,
            //   header: "Add Constituent to Basket",
            //   body: response?.action.msg ?? `Failed to create basket`,
            // });
          }
        });
    }
  }, [basketDataSource, basketId, basketName, onBasketCreated]);

  const handleSelectBasket = useCallback<TableRowSelectHandler>((row) => {
    if (row) {
      setBasketId(row.key);
      setTimeout(() => {
        saveButtonRef.current?.focus();
      }, 60);
    }
  }, []);

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
