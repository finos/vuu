package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.EditSessionRpcHandler;
import org.finos.vuu.net.rpc.EndEditSessionRpcHandler;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;

// An example of Java implementation of RpcHandler
public class UpdateRecordRpcHandler extends DefaultRpcHandlerImpl implements EditSessionRpcHandler, EndEditSessionRpcHandler {
    private final TableContainer tableContainer;

    public UpdateRecordRpcHandler(TableContainer tableContainer) {
        super();
        registerEditTableRpcs();
        registerEndEditSessionRpcs();
        this.tableContainer = tableContainer;
    }

    @Override
    public RpcFunctionResult deleteRow(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult deleteSelectedRows(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult deleteCell(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult addRow(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult editRow(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult editCell(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult submitForm(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult closeForm(RpcParams params) {
        return new RpcFunctionSuccess();
    }

    @Override
    public RpcFunctionResult undoRowChange(RpcParams params) {
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
