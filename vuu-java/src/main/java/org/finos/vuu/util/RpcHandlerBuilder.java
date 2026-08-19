package org.finos.vuu.util;

import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcHandler;
import org.finos.vuu.net.rpc.RpcParams;
import scala.Function1;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RpcHandlerBuilder {
    Map<String, Function1<RpcParams, RpcFunctionResult>> rpcHandlerMap = new ConcurrentHashMap<>();

    public RpcHandlerBuilder addRpc(String functionName, Function1<RpcParams, RpcFunctionResult> function) {
        rpcHandlerMap.put(functionName, function);
        return this;
    }

    public RpcHandler build() {
        RpcHandler rpcHandler = new DefaultRpcHandlerImpl();
        rpcHandlerMap.forEach(rpcHandler::registerRpc);
        return rpcHandler;
    }
}
