import { TableRowSelectHandler } from "@finos/vuu-table";
import { Commithandler, OpenChangeHandler } from "@finos/vuu-ui-controls";
import { buildColumnMap, metadataKeys } from "@finos/vuu-utils";
import { useCallback, useRef, useState } from "react";
import { NewBasketPanelProps } from "./NewBasketPanel";

const { KEY } = metadataKeys;

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
