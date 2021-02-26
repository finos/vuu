/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 18/11/2015.

  */
package io.venuu.vuu.client

import io.venuu.vuu.net._
import io.venuu.vuu.viewport.{DefaultRange, ViewPortRange}

import java.util.UUID
import scala.reflect.ClassTag
import scala.util.{Failure, Success, Try}

object ClientHelperFns {

  def authAsync(user: String, password: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage("", "", "", "",AuthenticateRequest(user, password)))
  }

  def loginAsync(token: String, user: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage("", "", "", "",LoginRequest(token, user)))
  }

  def createVpAsync(sessionId: String, token: String, user: String, requestId: String, table: String, columns: Array[String], sortBy: SortSpec, groupBy: Array[String] = Array(),
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

  def closeTreeNodeAsync(sessionId: String, token: String, user: String, requestId: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, CloseTreeNodeRequest(vpId, treeKey)))
  }

  def changeVpAsync(sessionId: String, token: String, user: String, requestId: String, vpId: String, columns: Array[String], sortBy: SortSpec, groupBy: Array[String] = Array(), filterSpec: FilterSpec, aggregations: Array[Aggregations] = Array())(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, ChangeViewPortRequest(vpId, columns, sort = sortBy, filterSpec = filterSpec, groupBy = groupBy, aggregations = aggregations)))
  }


  def tableListAsync(sessionId: String, token: String, user: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, GetTableList()))
  }

  def rpcTableUpdate(sessionId: String, token: String, user: String, table: String, key: String, data: Map[String, Any])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, RpcUpdate(table, key, data)))
  }

  def tableMetaAsync(sessionId: String, token: String, user: String, table: String, requestId: String)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(requestId, sessionId, token, user, GetTableMetaRequest(table)))
  }

  def heartbeatRespAsync(sessionId: String, token: String, user: String, ts: Long)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(VsMsg(UUID.randomUUID().toString, sessionId, token, user, HeartBeatResponse(ts)))
  }

  def changeVpRangeAsync(sessionId: String, token: String, user: String, vpId: String, range: ViewPortRange)(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, ChangeViewPortRange(vpId, range.from, range.to)))
  }

  def auth(user: String, password: String)(implicit vsClient: ViewServerClient): String = {
    vsClient.send(JsonViewServerMessage("", "", "", "",AuthenticateRequest(user, password)))
    vsClient.awaitMsg.body.asInstanceOf[AuthenticateSuccess].token
  }

  def rpcCall(sessionId: String, token: String, user: String, method: String, params: Array[Any], module: String)(implicit vsClient: ViewServerClient): RpcResponse = {

    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, RpcCall(method, params, Map()), module = module))

    def awaitMsg(vsClient: ViewServerClient): RpcResponse = {
      vsClient.awaitMsg.body match {
        case response: RpcResponse => response
        case _ => awaitMsg(vsClient)
      }
    }

    awaitMsg(vsClient)
  }

  def login(token: String, user: String)(implicit vsClient: ViewServerClient): String = {
    vsClient.send(JsonViewServerMessage("", "", "", "",LoginRequest(token, user)))
    vsClient.awaitMsg.sessionId
  }

  import scala.reflect.runtime.universe.{TypeTag, typeTag}

  private def await[TYPE: TypeTag](implicit client: ViewServerClient): ViewServerMessage = {

    val msg = client.awaitMsg

    val clazz = typeTag[TYPE].mirror.runtimeClass( typeTag[TYPE].tpe )

    val body = msg.body

    val classOfBody = body.getClass

    if(clazz == classOfBody)
      msg
    else
      await[TYPE]
  }

  def createVp(sessionId: String, token: String, user: String, table: String, columns: Array[String], range: ViewPortRange = DefaultRange, sort: SortSpec = SortSpec(List()))(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, CreateViewPortRequest(table, range, columns, sort)))
    await[CreateViewPortSuccess]
  }

  def changeVpAsync(sessionId: String, token: String, vpId: String , user: String, table: String, columns: Array[String], sortSpec: SortSpec, groupBy: Array[String])(implicit vsClient: ViewServerClient): Unit = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, ChangeViewPortRequest(vpId, columns, sortSpec, groupBy )))
  }

  def changeVp(sessionId: String, token: String, vpId: String , user: String, table: String, columns: Array[String], sortSpec: SortSpec, groupBy: Array[String])(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, ChangeViewPortRequest(vpId, columns, sortSpec, groupBy )))

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
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, OpenTreeNodeRequest(vpId, treeKey)))
    vsClient.awaitMsg
  }

  def closeVpTreeNode(sessionId: String, token: String, user: String, vpId: String, treeKey: String)(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, CloseTreeNodeRequest(vpId, treeKey)))
    vsClient.awaitMsg
  }

  def createVpGroupBy(sessionId: String, token: String, user: String, table: String, columns: Array[String], range: ViewPortRange = DefaultRange, groupBy: Array[String])(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, CreateViewPortRequest(table, range, columns, groupBy = groupBy)))
    vsClient.awaitMsg
  }

  def changeVpRange(sessionId: String, token: String, user: String, vpId: String, range: ViewPortRange)(implicit vsClient: ViewServerClient): ViewServerMessage = {
    vsClient.send(JsonViewServerMessage(UUID.randomUUID().toString, sessionId, token, user, ChangeViewPortRange(vpId, range.from, range.to)))
    vsClient.awaitMsg
  }

  def awaitMsgBody[T <: AnyRef](implicit t: ClassTag[T], vsClient: ViewServerClient): Option[T] = {
    val msg = vsClient.awaitMsg
    if(msg != null){
      val theType = t.runtimeClass.asInstanceOf[Class[T]]
      Try(assert(theType.isAssignableFrom(msg.body.getClass))) match {
        case Success(_) =>
          Some(msg.body.asInstanceOf[T])
        case Failure(err) =>
          awaitMsgBody[T]
      }

    }else
      None
  }
}
