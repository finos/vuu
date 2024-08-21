package org.finos.vuu.person;

import org.finos.vuu.core.module.typeahead.MyTypeAheadHandler;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.*;

import java.util.Arrays;

/* Work in Progress - do not use this as example yet
 * */
public class PersonRpcHandler extends DefaultRpcHandler {
    private final DataTable table;

    public PersonRpcHandler(DataTable table, TableContainer tableContainer) {
        this.table = table;

        var typeAheadHandler = new MyTypeAheadHandler(this, tableContainer);
        typeAheadHandler.register();

        registerRpc("UpdateName", (params) -> processUpdateNameRpcRequest(params));
        registerRpc("GetPeopleWithName", (params) -> processGetPeopleNameRpcRequest(params));
    }

    public RpcMethodCallResult processUpdateNameRpcRequest(RpcParams params) {
        updateName(
                params.namedParams().get("Id").get().toString(), //how to report error when expected param missing or fail to cast to right type
                params.namedParams().get("Name").get().toString()
        );
        return new RpcMethodSuccess(); //how to control what viewport action to trigger?
    }

    public RpcMethodCallResult processGetPeopleNameRpcRequest(RpcParams params) {
        var people = getPeopleWithNameThatStartWith(
                Arrays.stream(params.params()).findFirst().toString()
        );
        return new RpcMethodSuccess(people); //need to return result
    }

    public String[] updateName(String id, String newName) {
        //get person data from data source, update name, save to datasource?
        //should update table row or allow lifecycle sync to pick up change?
        return new String[0];
    }

    public String[] getPeopleWithNameThatStartWith(String search) {
        return new String[0];
    }
}

