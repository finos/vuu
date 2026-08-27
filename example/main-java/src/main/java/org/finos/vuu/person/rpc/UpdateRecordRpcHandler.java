package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.EditSessionRpcHandler;
import org.finos.vuu.net.rpc.EndEditSessionRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;

// An example of Java implementation of RpcHandler
public class UpdateRecordRpcHandler extends EndEditSessionRpcHandlerImpl implements EditSessionRpcHandler {
    private final TableContainer tableContainer;

    public UpdateRecordRpcHandler(TableContainer tableContainer) {
        super(tableContainer);
        registerEditTableRpcs();
        this.tableContainer = tableContainer;
    }

    // example of overriding rpc function
    @Override
    public RpcFunctionResult closeForm(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public boolean verifyPermission(RpcParams params) {
        return true;
    }

    @Override
    public boolean validateData(RpcParams params) {
        return true;
    }

    @Override
    public boolean submit(RpcParams params) {
        return true;
    }
}
