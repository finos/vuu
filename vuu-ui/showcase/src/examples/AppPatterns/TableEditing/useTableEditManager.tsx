import {
  DataSource,
  Selection,
  SelectionChangeHandler,
} from "@vuu-ui/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import {
  isOpenBulkEditResponse,
  useDataSource,
  viewportRpcRequest,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";

export const useTableEditManager = (vuuTable: VuuTable) => {
  const [open, setOpen] = useState(false);
  const [sessionDataSource, setSessionDataSource] = useState<DataSource>();
  const sessionRef = useRef<DataSource>();
  const { VuuDataSource } = useDataSource();

  const dataSource = useMemo(() => {
    const ds = new VuuDataSource({
      table: vuuTable,
    });
    return ds;
  }, [VuuDataSource, vuuTable]);

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    (selection: Selection) => {
      if (selection.length > 0) {
        setOpen(true);

        if (sessionRef.current) {
          sessionRef.current.rpcCall?.(
            viewportRpcRequest("VP_BULK_EDIT_END_RPC"),
          );
        }
        dataSource
          .menuRpcCall({
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENUS_SELECT_RPC",
          } as Omit<VuuRpcMenuRequest, "vpId">)
          .then((rpcResponse: VuuRpcResponse) => {
            if (isOpenBulkEditResponse(rpcResponse)) {
              const { table } = rpcResponse.action;
              const sessionDs = new VuuDataSource({
                table,
                viewport: table.table,
              });
              setSessionDataSource(sessionDs);
            }
          });
      } else {
        setOpen(false);
      }
    },
    [VuuDataSource, dataSource],
  );

  return {
    dataSource,
    open,
    onSelectionChange: handleSelectionChange,
    sessionDataSource,
  };
};
