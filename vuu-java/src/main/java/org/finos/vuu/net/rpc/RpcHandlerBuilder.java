package org.finos.vuu.net.rpc;

import org.finos.vuu.viewport.ViewPortMenu;
import scala.Function1;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Builder for {@link org.finos.vuu.net.rpc.RpcHandler}.
 */
public class RpcHandlerBuilder {
    Map<String, Function1<RpcParams, RpcFunctionResult>> rpcs = new ConcurrentHashMap<>();
    private ViewPortMenu menu;

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
     * Sets the right-click viewport context menu this handler's table should expose - a
     * {@link org.finos.vuu.viewport.ViewPortMenuItem} such as
     * {@link org.finos.vuu.viewport.SelectionViewPortMenuItem}, or several combined via
     * {@link ViewPortMenu#apply(scala.collection.immutable.Seq)}. Optional - a handler built
     * without one exposes no context menu, the same as {@link DefaultRpcHandler#apply()}.
     *
     * @param menu the menu to expose
     * @return this builder
     */
    public RpcHandlerBuilder menu(ViewPortMenu menu) {
        this.menu = menu;
        return this;
    }

    /**
     * Builds {@link RpcHandler}.
     *
     * @return {@link RpcHandler}
     */
    public RpcHandler build() {
        RpcHandler rpcHandler = (menu != null) ? new RpcHandlerWithMenu(menu) : DefaultRpcHandler.apply();
        rpcs.forEach(rpcHandler::registerRpc);
        return rpcHandler;
    }
}
