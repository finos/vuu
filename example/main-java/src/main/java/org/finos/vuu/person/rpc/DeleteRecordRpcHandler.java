package org.finos.vuu.person.rpc;

import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;

public class DeleteRecordRpcHandler implements DeleteRecordRpcHandlerIF {
    @Override
    public RpcFunctionResult deleteRecord(RpcParams params) {
        // override with some logic here
        return new RpcFunctionSuccess();
    }
}
