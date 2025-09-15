
package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.typeahead.ViewportTypeAheadRpcHandler
import org.finos.vuu.core.table.TableContainer

import java.util.concurrent.ConcurrentHashMap

class DefaultRpcHandler(implicit tableContainer: TableContainer) extends RpcHandler with StrictLogging {

  private val rpcHandlerMap = new ConcurrentHashMap[Rpc.FunctionName, Rpc.Function]()

  private val viewportTypeAheadRpcHandler = new ViewportTypeAheadRpcHandler(tableContainer)
  viewportTypeAheadRpcHandler.register(this)

  /**
   * Register a handler for a given rpc function
   *
   * @param functionName name of the rpc function
   * @param handlerFunc  handler function that takes RpcParams and return RpcMethodCallResult
   */

  def registerRpc(functionName: Rpc.FunctionName, handlerFunc: Rpc.Function): Unit = {

    if (rpcHandlerMap.containsKey(functionName)) {
      throw new IllegalArgumentException(s"Function $functionName already registered")
    }
    rpcHandlerMap.put(functionName, handlerFunc)
  }

  override def processRpcRequest(rpcName: String, params: RpcParams): RpcFunctionResult = {
    if (rpcHandlerMap.containsKey(rpcName)) {
      try {
        val handler = rpcHandlerMap.get(rpcName)
        handler(params)
      } catch {
        case e: Exception =>
          logger.error(s"Error processing rpc method $rpcName", e)
          RpcFunctionFailure(1, e.toString, e)
      }
    } else {
      new RpcFunctionFailure(s"Could not find rpcMethodHandler $rpcName")
    }
  }
}
