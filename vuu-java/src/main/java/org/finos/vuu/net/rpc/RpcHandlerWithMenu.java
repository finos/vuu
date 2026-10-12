package org.finos.vuu.net.rpc;

import org.finos.vuu.viewport.ViewPortMenu;

/**
 * A {@link DefaultRpcHandlerImpl} whose {@link #menuItems()} is fixed at construction time.
 * <p>
 * {@link RpcHandler#menuItems()} is a plain overridable method with no other abstract members
 * on the trait, so attaching a custom {@link ViewPortMenu} normally just means overriding it in
 * a subclass - straightforward from Scala or Java, but not from a caller (e.g. JPype from
 * Python) that can only implement Java <em>interfaces</em>, not subclass a concrete JVM class.
 * {@link RpcHandlerBuilder} uses this class to cover that case.
 */
public class RpcHandlerWithMenu extends DefaultRpcHandlerImpl {

    private final ViewPortMenu menu;

    public RpcHandlerWithMenu(ViewPortMenu menu) {
        this.menu = menu;
    }

    @Override
    public ViewPortMenu menuItems() {
        return menu;
    }
}
