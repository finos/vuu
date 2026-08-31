package org.finos.vuu.net.rpc;

import scala.Function1;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Builder for {@link org.finos.vuu.net.rpc.RpcHandler}.
 */
public class RpcHandlerBuilder {
    Map<String, Function1<RpcParams, RpcFunctionResult>> rpcs = new ConcurrentHashMap<>();

    /**
     * Add RPC
     *
     * @param functionName RPC name
     * @param function     RPC function
     * @return this builder
     */
    public RpcHandlerBuilder addRpc(String functionName, Function1<RpcParams, RpcFunctionResult> function) {
        rpcs.put(functionName, function);
        return this;
    }

    /**
     * Builds {@link RpcHandler}.
     *
     * @return {@link RpcHandler}
     */
    public RpcHandler build() {
        RpcHandler rpcHandler = DefaultRpcHandler.apply();
        rpcs.forEach(rpcHandler::registerRpc);
        return rpcHandler;
    }
}
