package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net._
import org.finos.vuu.viewport._

import java.lang.reflect.{Method, Type}

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

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  def implementsService(serviceIf: String): Boolean = {
    this.getClass.getInterfaces.exists(_.getSimpleName == serviceIf)
  }

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  // Note this map is not used in DefaultRpcHandler, hence if using DefaultRpcHandler, register directly with DefaultRpcHandler.registerRpc
  val methodsAndParams: Map[String, Array[(String, Array[Type], Method)]] = this.getClass.getMethods.map(method => (method.getName, method.getGenericParameterTypes, method)).groupBy(_._1)

  /***
   * This is new RPC request message and any RpcHandler that wishes to use this message should extend DefaultRpcHandler
   */
  def processRpcRequest(rpcName: String, params: RpcParams): RpcFunctionResult = new RpcFunctionFailure("Unsupported request type")

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  def processViewPortRpcCall(methodName: String, rcpParams: RpcParams):ViewPortAction = {

    val (params, ctx) = (rcpParams.params, rcpParams.ctx)

    if (!methodsAndParams.contains(methodName)) {
      ViewPortRpcFailure(s"Could not find method $methodName")
    } else {

      val overloadedMethods = methodsAndParams(methodName)

      val method = findBestMatchingMethod(methodName, params, overloadedMethods)

      try {
        val r = if (params.length == 0)
          method.get.invoke(this, ctx)
        else if (params.length == 1)
          method.get.invoke(this, toO(params(0)), ctx)
        else if (params.length == 2)
          method.get.invoke(this, toO(params(0)), toO(params(1)), ctx)
        else if (params.length == 3)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), ctx)
        else if (params.length == 4)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), toO(params(3)), ctx)
        else if (params.length == 5)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), toO(params(3)), toO(params(4)), ctx)
        else if (params.length == 6)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), toO(params(3)), toO(params(4)), toO(params(5)), ctx)
        else if (params.length == 7)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), toO(params(3)), toO(params(4)), toO(params(5)), toO(params(6)), ctx)
        else if (params.length == 8)
          method.get.invoke(this, toO(params(0)), toO(params(1)), toO(params(2)), toO(params(3)), toO(params(4)), toO(params(5)), toO(params(6)), toO(params(7)), ctx)

        r.asInstanceOf[ViewPortAction]
      } catch {
        case ex: Exception =>
          logger.error(s"Exception occurred calling rpc $method", ex)
          ViewPortRpcFailure(s"Exception occurred calling rpc $method")
      }
    }
  }

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {

    if (!methodsAndParams.contains(rpc.method)) {
      onError(s"error could not find method ${rpc.method}", 1)
    } else {

      val overloadedMethods = methodsAndParams(rpc.method)

      val method = findBestMatchingMethod(rpc, overloadedMethods)

      try{
        val r = if (rpc.params.length == 0)
          method.get.invoke(this, ctx)
        else if (rpc.params.length == 1)
          method.get.invoke(this, toO(rpc.params(0)), ctx)
        else if (rpc.params.length == 2)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), ctx)
        else if (rpc.params.length == 3)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), ctx)
        else if (rpc.params.length == 4)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), ctx)
        else if (rpc.params.length == 5)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), ctx)
        else if (rpc.params.length == 6)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), ctx)
        else if (rpc.params.length == 7)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), ctx)
        else if (rpc.params.length == 8)
          method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), toO(rpc.params(7)), ctx)

        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, r, null), module = msg.module))
      }catch{
        case ex: Exception =>
          logger.error(s"Exception occurred calling rpc $rpc", ex)
          Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, null, Error(ex.getMessage, ex.hashCode())), module = msg.module))
      }


    }
  }

  private def toO(x: Any): AnyRef = x.asInstanceOf[AnyRef]

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  private def findBestMatchingMethod(rpc: RpcCall, methods: Array[(String, Array[java.lang.reflect.Type], Method)]): Option[Method] = {

    val size = rpc.params.length + 1

    val filteredBySize = methods.filter(_._2.length == size)

    filteredBySize.find(m => paramsEqualsRpcParams(m._3, rpc)) match {
      case Some(tuple) => Some(tuple._3)
      case None => None
    }
  }

  private def findBestMatchingMethod(method: String, params: Array[Any], methods: Array[(String, Array[java.lang.reflect.Type], Method)]): Option[Method] = {

    val size = params.length + 1

    val filteredBySize = methods.filter(_._2.length == size)

    filteredBySize.find(m => paramsEqualsRpcParams(m._3, params)) match {
      case Some(tuple) => Some(tuple._3)
      case None => None
    }
  }

  private def paramsEqualsRpcParams(method: Method, params: Array[Any]): Boolean = {

    val assignable = params.zip(method.getGenericParameterTypes).map({ case (value, classParam) =>
      classParam.getClass.isAssignableFrom(value.getClass)
    })

    assignable.length == params.length
  }

  @deprecated("Replaced by DefaultRpcHandler.rpcHandlerMap")
  private def paramsEqualsRpcParams(method: Method, rpcCall: RpcCall): Boolean = {

    val assignable = rpcCall.params.zip(method.getGenericParameterTypes).map({ case (value, classParam) =>
      classParam.getClass.isAssignableFrom(value.getClass)
    })

    assignable.length == rpcCall.params.length
  }

  private def onError(message: String, code: Int): Option[ViewServerMessage] = {
    None
  }

}
