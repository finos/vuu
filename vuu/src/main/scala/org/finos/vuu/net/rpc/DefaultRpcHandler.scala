
package org.finos.vuu.net.rpc

import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler

trait DefaultRpcHandler() extends RpcHandler with ViewportTypeAheadRpcHandler {}

// added this class for java
class DefaultRpcHandlerImpl extends DefaultRpcHandler

object DefaultRpcHandler {
  def apply() = new DefaultRpcHandlerImpl
}