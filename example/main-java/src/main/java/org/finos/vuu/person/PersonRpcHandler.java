package org.finos.vuu.person;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;

// An example of RPC handler class in java
public class PersonRpcHandler {
    private final DataTable table;

    public PersonRpcHandler(DataTable table) {
        this.table = table;
    }

    public RpcFunctionResult processUpdateNameRpcRequest(RpcParams params) {
        var paramData = params.namedParams();
        updateName(paramData.get("id").get().toString(), paramData.get("name").get().toString());
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
        var accountNumber = (int) rowData.get("account");
        return accountNumber;
    }
}

