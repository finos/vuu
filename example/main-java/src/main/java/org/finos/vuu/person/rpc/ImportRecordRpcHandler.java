package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;
import org.finos.vuu.net.rpc.sessiontable.EndSessionRpcHandler;
import org.finos.vuu.net.rpc.sessiontable.ImportSessionRpcHandler;

// An example of Java implementation of ImportSessionRpcHandler and EndSessionRpcHandler
public class ImportRecordRpcHandler extends DefaultRpcHandlerImpl implements ImportSessionRpcHandler, EndSessionRpcHandler {
    private final TableContainer tableContainer;

    public ImportRecordRpcHandler(TableContainer tableContainer) {
        super();
        registerEditTableRpcs();
        registerEndEditSessionRpcs();
        this.tableContainer = tableContainer;
    }

    @Override
    public int maxSessionTableSize() {
        return 100;
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
