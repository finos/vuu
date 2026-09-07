package org.finos.vuu.person.rpc;

import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;

// An example of PRC handler interface in Java
public interface DeleteRecordRpcHandlerIF {

    default RpcFunctionResult deleteRecord(RpcParams params) {
        // some logic here
        return new RpcFunctionSuccess();
    }
}
