import { isOpenBulkEditResponse } from "@vuu-ui/vuu-context-menu";
import { DataSource } from "@vuu-ui/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { SelectionChangeHandler } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";

export const useTableEditManager = (vuuTable: VuuTable) => {
  const [open, setOpen] = useState(false);
  const [sessionDataSource, setSessionDataSource] = useState<DataSource>();
  const sessionRef = useRef<DataSource>(undefined);
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    const ds = new VuuDataSource({
      table: vuuTable,
    });
    return ds;
  }, [VuuDataSource, vuuTable]);

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    ({ type }) => {
      if (type === "SELECT_ROW" || type === "SELECT_ROW_RANGE") {
        setOpen(true);

        if (sessionRef.current) {
          sessionRef.current.rpcRequest?.({
            params: {},
            rpcName: "VP_BULK_EDIT_END_RPC",
            type: "RPC_REQUEST",
          });
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
