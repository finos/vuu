
package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler
import org.finos.vuu.core.table.TableContainer

class DefaultRpcHandler(implicit tableContainer: TableContainer) extends RpcHandler with StrictLogging {

  private val viewportTypeAheadRpcHandler = new ViewportTypeAheadRpcHandler(tableContainer)
  viewportTypeAheadRpcHandler.register(this)
}
