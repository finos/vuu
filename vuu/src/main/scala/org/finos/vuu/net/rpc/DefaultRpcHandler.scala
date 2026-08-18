
package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler

trait DefaultRpcHandler() extends RpcHandler with ViewportTypeAheadRpcHandler with StrictLogging {}

class DefaultRpcHandlerImpl extends DefaultRpcHandler