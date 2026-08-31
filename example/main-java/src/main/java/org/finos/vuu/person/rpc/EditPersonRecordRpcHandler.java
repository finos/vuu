package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.sessiontable.CreateSessionTableRpcHandler;
import org.finos.vuu.net.rpc.RpcPermissionChecker;

public class EditPersonRecordRpcHandler extends DefaultRpcHandlerImpl implements CreateSessionTableRpcHandler {

    private final RpcPermissionChecker rpcPermissionChecker;
    private final TableContainer tableContainer;

    public EditPersonRecordRpcHandler(RpcPermissionChecker rpcPermissionChecker, TableContainer tableContainer) {
        super();
        registerCreateSessionTableRpcs();
        this.rpcPermissionChecker = rpcPermissionChecker;
        this.tableContainer = tableContainer;
    }

    @Override
    public RpcPermissionChecker rpcPermissionChecker() {
        return rpcPermissionChecker;
    }

    @Override
    public TableContainer tableContainer() {
        return tableContainer;
    }
}
