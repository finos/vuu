package org.finos.vuu.person;

import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.*;

public class PersonRpcHandler extends DefaultRpcHandler {
    private final DataTable table;

    public PersonRpcHandler(DataTable table, TableContainer tableContainer) {
        this.table = table;

        var typeAheadHandler = new ViewportTypeAheadRpcHandler(this, tableContainer);
        typeAheadHandler.register();

        registerRpc("UpdateName", (params) -> processUpdateNameRpcRequest(params));
        registerRpc("GetAccountId", (params) -> processGetAccountIdRpcRequest(params));
    }

    public RpcFunctionResult processUpdateNameRpcRequest(RpcParams params) {
        var paramData = params.namedParams();
        updateName(paramData.get("Id").get().toString(), paramData.get("Name").get().toString());
        return new RpcFunctionSuccess();
    }

    public RpcFunctionResult processGetAccountIdRpcRequest(RpcParams params) {
        var people = getAccountId(
                params.namedParams().get("rowKey").get().toString()
        );
        return new RpcFunctionSuccess(people); //need to return result
    }

    public String[] updateName(String id, String newName) {
        //get person data from data source, update name, save to datasource?
        //should update table row or allow lifecycle sync to pick up change?
        return new String[0];
    }

    public int getAccountId(String rowKey) {
        var rowData = this.table.pullRow(rowKey);
        var accountNumber = (int) rowData.get("Account");
        return accountNumber;
    }
}

