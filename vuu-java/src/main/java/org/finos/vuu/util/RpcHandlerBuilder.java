package org.finos.vuu.util;

import org.finos.vuu.net.rpc.DefaultRpcHandler$;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcHandler;
import org.finos.vuu.net.rpc.RpcParams;
import scala.Function1;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RpcHandlerBuilder {
    Map<String, Function1<RpcParams, RpcFunctionResult>> rpcs = new ConcurrentHashMap<>();

    public RpcHandlerBuilder addRpc(String functionName, Function1<RpcParams, RpcFunctionResult> function) {
        rpcs.put(functionName, function);
        return this;
    }

    public RpcHandler build() {
        RpcHandler rpcHandler = DefaultRpcHandler$.MODULE$;
        rpcs.forEach(rpcHandler::registerRpc);
        return rpcHandler;
    }
}
