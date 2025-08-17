import { TableSchema, ViewportRpcResponse } from "@vuu-ui/vuu-data-types";
import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import { OpenChangeHandler } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, buildColumnMap, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VuuRpcViewportRequest } from "@vuu-ui/vuu-protocol-types";

export type BasketCreatedHandler = (
  basketName: string,
  basketId: string,
  instanceId: string,
) => void;

export interface NewBasketDialogHookProps {
  basketSchema: TableSchema;
  onBasketCreated: BasketCreatedHandler;
}

export const useNewBasketDialog = ({
  basketSchema,
  onBasketCreated,
}: NewBasketDialogHookProps) => {
  const columnMap = buildColumnMap(basketSchema.columns);
  const [basketName, setBasketName] = useState("");
  const [basketId, setBasketId] = useState<string>();
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const { VuuDataSource } = useData();
  const basketDataSource = useMemo(() => {
    const ds = new VuuDataSource({ table: basketSchema.table });
    ds.subscribe({}, () => {
      // we don't really care about messages from this dataSource, we
      // only use it as a conduit for creating a basket.
    });
    return ds;
  }, [VuuDataSource, basketSchema]);

  useEffect(() => {
    return () => {
      basketDataSource.unsubscribe();
    };
  }, [basketDataSource]);

  const saveBasket = useCallback(() => {
    if (basketName && basketId) {
      basketDataSource
        .rpcCall?.<ViewportRpcResponse>({
          namedParams: {},
          params: [basketId, basketName],
          rpcName: "createBasket",
          type: "VIEW_PORT_RPC_CALL",
        } as Omit<VuuRpcViewportRequest, "vpId">)
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

  const handleChangeBasketName = useCallback<CommitHandler>((_, value) => {
    if (typeof value === "string") {
      setBasketName(value);
    }
    return Promise.resolve(true);
  }, []);

  const handleOpenChangeInstrumentPicker = useCallback<OpenChangeHandler>(
    (open) => {
      if (!open) {
        basketDataSource.disable?.();
      }
    },
    [basketDataSource],
  );

  const confirmButtonProps = {
    label: "Save",
    disabled: basketName === "" || basketId === undefined,
    ref: saveButtonRef,
  };

  return {
    columnMap,
    confirmButtonProps,
    onChangeBasketName: handleChangeBasketName,
    onCloseInstrumentPicker: handleOpenChangeInstrumentPicker,
    onOpenChangeInstrumentPicker: handleOpenChangeInstrumentPicker,
    onSave: saveBasket,
    onSelectBasket: handleSelectBasket,
  };
};
