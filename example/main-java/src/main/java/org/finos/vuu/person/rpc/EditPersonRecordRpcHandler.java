package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.CreateSessionTableRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcPermissionChecker;

public class EditPersonRecordRpcHandler extends CreateSessionTableRpcHandlerImpl {

    public EditPersonRecordRpcHandler(RpcPermissionChecker rpcPermissionChecker, TableContainer tableContainer) {
        super(rpcPermissionChecker, tableContainer);
    }
}
