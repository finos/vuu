package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcParams;
import org.finos.vuu.net.rpc.sessiontable.EditSessionRpcHandler;
import org.finos.vuu.net.rpc.sessiontable.EndSessionRpcHandler;

// An example of Java implementation of EditSessionRpcHandler and EndSessionRpcHandler
public class EditRecordRpcHandler extends DefaultRpcHandlerImpl implements EditSessionRpcHandler, EndSessionRpcHandler {
    private final TableContainer tableContainer;

    public EditRecordRpcHandler(TableContainer tableContainer) {
        this.tableContainer = tableContainer;
        registerEditTableRpcs();
        registerEndEditSessionRpcs();
    }

    @Override
    public TableContainer tableContainer() {
        return tableContainer;
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
