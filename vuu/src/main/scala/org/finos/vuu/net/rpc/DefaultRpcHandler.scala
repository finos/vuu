
package org.finos.vuu.net.rpc

import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler

trait DefaultRpcHandler() extends RpcHandler with ViewportTypeAheadRpcHandler {}

object DefaultRpcHandlerImpl extends DefaultRpcHandler