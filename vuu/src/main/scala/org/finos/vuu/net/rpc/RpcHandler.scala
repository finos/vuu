package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net._
import org.finos.vuu.viewport._

import java.lang.reflect.Method

trait RpcHandler extends StrictLogging {

  def menuItems(): ViewPortMenu = EmptyViewPortMenu

  def menusAsMap() = {

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

  lazy val menuMap = menusAsMap()

  def implementsService(serviceIf: String): Boolean = {
    this.getClass.getInterfaces.exists(_.getSimpleName == serviceIf)
  }

  val methodsAndParams = this.getClass.getMethods.map(method => (method.getName, method.getGenericParameterTypes, method)).groupBy(_._1).toMap

  def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {

    if (!methodsAndParams.contains(rpc.method)) {
      onError(s"error could not find method ${rpc.method}", 1)
    } else {

      val overloadedMethods = methodsAndParams.get(rpc.method).get

      val method = findBestMatchingMethod(rpc, overloadedMethods)

      try{
        val r = if (rpc.params.size == 0)
          method.get.invoke(this, ctx)
        else if (rpc.params.size == 1)
          method.get.invoke(this, toO(rpc.params(0)), ctx)
        else if (rpc.params.size == 2)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), ctx)
        else if (rpc.params.size == 3)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), ctx)
        else if (rpc.params.size == 4)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), ctx)
        else if (rpc.params.size == 5)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), ctx)
        else if (rpc.params.size == 6)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), ctx)
        else if (rpc.params.size == 7)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), ctx)
        else if (rpc.params.size == 8)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), toO(rpc.params(7)), ctx)

        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, r, null), module = msg.module))
      }catch{
        case ex: Exception =>
          logger.error(s"Exception occurred calling rpc ${rpc}", ex)
          Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, null, Error(ex.getMessage, ex.hashCode())), module = msg.module))
      }


    }
  }

  def toO(x: Any): AnyRef = x.asInstanceOf[AnyRef]

  def findBestMatchingMethod(rpc: RpcCall, methods: Array[(String, Array[java.lang.reflect.Type], Method)]): Option[Method] = {

    val size = rpc.params.size + 1

    val filteredBySize = methods.filter(_._2.size == size)

    filteredBySize.find(m => paramsEqualsRpcParams(m._3, rpc)) match {
      case Some(tuple) => Some(tuple._3)
      case None => None
    }
  }

  def paramsEqualsRpcParams(method: Method, rpcCall: RpcCall): Boolean = {

    val assignable = rpcCall.params.zip(method.getGenericParameterTypes).map({ case (value, classParam) =>
      classParam.getClass.isAssignableFrom(value.getClass)
    })

    assignable.size == rpcCall.params.size
  }

  def onError(message: String, code: Int): Option[ViewServerMessage] = {
    None
  }

}
