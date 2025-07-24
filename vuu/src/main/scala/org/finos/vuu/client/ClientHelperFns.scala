package org.finos.vuu.client
import org.finos.vuu.net._

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.viewport.{DefaultRange, ViewPortRange, ViewPortTable}

import scala.reflect.ClassTag
import scala.util.{Failure, Success, Try}

object ClientHelperFns {

  def authAsync(user: String, password: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage("", "", "", "", AuthenticateRequest(user, password)))
  }

  def loginAsync(token: String, user: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage("", "", "", "", LoginRequest(token, user)))
  }

  def createVpAsync(sessionId: String, token: String, user: String, requestId: String, table: ViewPortTable, columns: Array[String], sortBy: SortSpec, groupBy: Array[String] = Array(),
                    range: ViewPortRange = DefaultRange, filterSpec: FilterSpec)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, CreateViewPortRequest(table, range, columns, sort = sortBy, filterSpec = filterSpec, groupBy = groupBy)))
  }

  def openTreeNodeAsync(sessionId: String, token: String, user: String, requestId: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, OpenTreeNodeRequest(vpId, treeKey)))
  }

  def setSelection(sessionId: String, token: String, user: String, requestId: String, vpId: String, selection: Array[Int])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, SetSelectionRequest(vpId, selection)))
  }

  def getVisualLinks(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, GetViewPortVisualLinksRequest(vpId)))
  }

  def createVisualLink(sessionId: String, token: String, user: String, requestId: String, childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, CreateVisualLinkRequest(childVpId, parentVpId, childColumnName, parentColumnName)))
  }

  def removeViewPort(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, RemoveViewPortRequest(vpId)))
  }

  def viewPortMenuSelectionRpcCall(sessionId: String, token: String, user: String, requestId: String, vpId: String, rpcName: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ViewPortMenuSelectionRpcCall(vpId, rpcName)))
  }

  def viewPortMenuRowRpcCall(sessionId: String, token: String, user: String, requestId: String, vpId: String, rpcName: String, rowKey: String, row: Map[String, Object])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ViewPortMenuRowRpcCall(vpId, rpcName, rowKey, row)))
  }

  def viewPortMenuCellRpcCall(sessionId: String, token: String, user: String, requestId: String, vpId: String, rpcName: String, rowKey: String, field: String, value: Object)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ViewPortMenuCellRpcCall(vpId, rpcName, rowKey, field, value)))
  }

  def viewPortMenuTableRpcCall(sessionId: String, token: String, user: String, requestId: String, vpId: String, rpcName: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ViewPortMenuTableRpcCall(vpId, rpcName)))
  }

  def enableViewPort(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, EnableViewPortRequest(vpId)))
  }

  def disableViewPort(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, DisableViewPortRequest(vpId)))
  }

  def freezeViewPort(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, FreezeViewPortRequest(vpId)))
  }

  def unfreezeViewPort(sessionId: String, token: String, user: String, requestId: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, UnfreezeViewPortRequest(vpId)))
  }

  def closeTreeNodeAsync(sessionId: String, token: String, user: String, requestId: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, CloseTreeNodeRequest(vpId, treeKey)))
  }

  def changeVpAsync(sessionId: String, token: String, user: String, requestId: String, vpId: String, columns: Array[String], sortBy: SortSpec, groupBy: Array[String] = Array(), filterSpec: FilterSpec, aggregations: Array[Aggregations] = Array())(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ChangeViewPortRequest(vpId, columns, sort = sortBy, filterSpec = filterSpec, groupBy = groupBy, aggregations = aggregations)))
  }

  def tableListAsync(sessionId: String, token: String, user: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, GetTableList()))
  }

  def rpcTableUpdate(sessionId: String, token: String, user: String, table: ViewPortTable, key: String, data: Map[String, Any])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, RpcUpdate(table, key, data)))
  }

  def getViewPortMenusAsync(sessionId: String, token: String, user: String, vpId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, GetViewPortMenusRequest(vpId)))
  }

  def tableMetaAsync(sessionId: String, token: String, user: String, table: ViewPortTable, requestId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, GetTableMetaRequest(table)))
  }

  def heartbeatRespAsync(sessionId: String, token: String, user: String, ts: Long)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(VsMsg(RequestId.oneNew(), sessionId, token, user, HeartBeatResponse(ts)))
  }

  def changeVpRangeAsync(sessionId: String, token: String, user: String, vpId: String, range: ViewPortRange)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, ChangeViewPortRange(vpId, range.from, range.to)))
  }

  def auth(user: String, password: String)(implicit vsClient: ViewServerClient): String = {
    vsClient.send(JsonViewServerMessage("", "", "", "", AuthenticateRequest(user, password)))
    awaitMsgBody[AuthenticateSuccess].get.token
  }

  def rpcCallAsync(sessionId: String, token: String, user: String, service: String, method: String, params: Array[Any], module: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, RpcCall(service, method, params, Map()), module = module))
  }

  def menuRpcCall(sessionId: String, token: String, user: String, service: String, method: String, params: Array[Any], module: String)(implicit vsClient: ViewServerClient): MenuRpcResponse = {

    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, MenuRpcCall(service, method, params, Map()), module = module))

    def awaitMsg(vsClient: ViewServerClient): MenuRpcResponse = {
      vsClient.awaitMsg.body match {
        case response: MenuRpcResponse => response
        case _ => awaitMsg(vsClient)
      }
    }

    awaitMsg(vsClient)
  }

  def rpcCall(sessionId: String, token: String, user: String, service: String, method: String, params: Array[Any], module: String)(implicit vsClient: ViewServerClient): RpcResponse = {

    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, RpcCall(service, method, params, Map()), module = module))

    def awaitMsg(vsClient: ViewServerClient): RpcResponse = {
      vsClient.awaitMsg.body match {
        case response: RpcResponse => response
        case _ => awaitMsg(vsClient)
      }
    }

    awaitMsg(vsClient)
  }

  def login(token: String, user: String)(implicit vsClient: ViewServerClient): String = {
    vsClient.send(JsonViewServerMessage("", "", "", "", LoginRequest(token, user)))
    vsClient.awaitMsg.sessionId
  }

  import scala.reflect.runtime.universe.{TypeTag, typeTag}

  private def await[TYPE: TypeTag](implicit client: ViewServerClient): ViewServerMessage = {

    val msg = client.awaitMsg

    val clazz = typeTag[TYPE].mirror.runtimeClass(typeTag[TYPE].tpe)

    val body = msg.body

    val classOfBody = body.getClass

    if (clazz == classOfBody)
      msg
    else
      await[TYPE]
  }

  def createVp(sessionId: String, token: String, user: String, table: ViewPortTable, columns: Array[String], range: ViewPortRange = DefaultRange, sort: SortSpec = SortSpec(List()))(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, CreateViewPortRequest(table, range, columns, sort)))
    await[CreateViewPortSuccess]
  }

  def changeVpAsync(sessionId: String, token: String, vpId: String, user: String, table: String, columns: Array[String], sortSpec: SortSpec, groupBy: Array[String])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, ChangeViewPortRequest(vpId, columns, sortSpec, groupBy)))
  }

  def changeVp(sessionId: String, token: String, vpId: String, user: String, table: String, columns: Array[String], sortSpec: SortSpec, groupBy: Array[String])(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, ChangeViewPortRequest(vpId, columns, sortSpec, groupBy)))

    def awaitMsg(vsClient: ViewServerClient): ViewServerMessage = {
      val msg = vsClient.awaitMsg
      msg.body match {
        case response: ChangeViewPortReject => msg
        case response: ChangeViewPortSuccess => msg
        case _ => awaitMsg(vsClient)
      }
    }

    awaitMsg(vsClient)
  }

  def openVpTreeNode(sessionId: String, token: String, user: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, OpenTreeNodeRequest(vpId, treeKey)))
    vsClient.awaitMsg
  }

  def closeVpTreeNode(sessionId: String, token: String, user: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, CloseTreeNodeRequest(vpId, treeKey)))
    vsClient.awaitMsg
  }

  def createVpGroupBy(sessionId: String, token: String, user: String, table: ViewPortTable, columns: Array[String], range: ViewPortRange = DefaultRange, groupBy: Array[String])(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, CreateViewPortRequest(table, range, columns, groupBy = groupBy)))
    vsClient.awaitMsg
  }

  def changeVpRange(sessionId: String, token: String, user: String, vpId: String, range: ViewPortRange)(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(RequestId.oneNew(), sessionId, token, user, ChangeViewPortRange(vpId, range.from, range.to)))
    vsClient.awaitMsg
  }

  def awaitMsgBody[T <: AnyRef](implicit t: ClassTag[T], vsClient: ViewServerClient): Option[T] = {
    val msg = vsClient.awaitMsg
    if (msg != null) {
      val theType = t.runtimeClass.asInstanceOf[Class[T]]
      Try(assert(theType.isAssignableFrom(msg.body.getClass))) match {
        case Success(_) =>
          Some(msg.body.asInstanceOf[T])
        case Failure(err) =>
          awaitMsgBody[T]
      }

    } else
      None
  }
}
