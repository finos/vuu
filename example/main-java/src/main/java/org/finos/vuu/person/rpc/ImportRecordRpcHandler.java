package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;
import org.finos.vuu.net.rpc.sessiontable.CompositeImportRpcHandler;

// An example of Java implementation of ImportSessionRpcHandler
public class ImportRecordRpcHandler extends CompositeImportRpcHandler {
    private final TableContainer tableContainer;

    public ImportRecordRpcHandler(TableContainer tableContainer) {
        super(tableContainer);
        this.tableContainer = tableContainer;
    }

    @Override
    public RpcFunctionResult addRowWithoutVuuMsg(RpcParams params) {
        return new RpcFunctionSuccess();
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
