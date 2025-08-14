package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.viewport._

trait RpcHandler extends StrictLogging {

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
      }
    }

    foldMenus(menus)(Map())
  }

  lazy val menuMap: Map[String, ViewPortMenuItem] = menusAsMap()

  /**
   * This is new RPC request message and any RpcHandler that wishes to use this message should extend DefaultRpcHandler
   */
  def processRpcRequest(rpcName: String, params: RpcParams): RpcFunctionResult = new RpcFunctionFailure("Unsupported request type")

}
