package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.viewport.*

import java.util.concurrent.ConcurrentHashMap

trait RpcHandler extends StrictLogging {
  val rpcNotSupportedMsg = "Not supported"

  def menuItems(): ViewPortMenu = EmptyViewPortMenu

  def menusAsMap(): Map[String, ViewPortMenuItem] = {

    val menus = menuItems()

    def foldMenus(viewPortMenu: ViewPortMenu)(result: Map[String, ViewPortMenuItem]): Map[String, ViewPortMenuItem] = {
      viewPortMenu match {
        case folder: ViewPortMenuFolder =>
          folder.menus.foldLeft(result)((soFar, vpMenu) => soFar ++ foldMenus(vpMenu)(result))
        case selection: SelectionViewPortMenuItem =>
          result ++ Map(selection.rpcName -> selection)
        case table: TableViewPortMenuItem =>
          result ++ Map(table.rpcName -> table)
        case cell: CellViewPortMenuItem =>
          result ++ Map(cell.rpcName -> cell)
        case row: RowViewPortMenuItem =>
          result ++ Map(row.rpcName -> row)
        case EmptyViewPortMenu => result
      }
    }

    foldMenus(menus)(Map())
  }

  lazy val menuMap: Map[String, ViewPortMenuItem] = menusAsMap()

  private val rpcHandlerMap = new ConcurrentHashMap[Rpc.FunctionName, Rpc.Function]()

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

  def processRpcRequest(rpcName: String, params: RpcParams): RpcFunctionResult = {
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
