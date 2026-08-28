package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.RpcPermissionChecker;

// An example of Java implementation of EditSessionRpcHandler and EndSessionRpcHandler
public class EditRecordRpcHandler  {
    private final TableContainer tableContainer;

    public EditRecordRpcHandler(TableContainer tableContainer, RpcPermissionChecker rpcPermissionChecker) {

        this.tableContainer = tableContainer;
    }


}
