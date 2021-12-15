/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing.client

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.net._
import io.venuu.vuu.viewport.ViewPortRange

import java.util.concurrent.ConcurrentHashMap


case class UserPrincipal(user: String, token: String, sessionId: String)

class Worker(implicit eventBus: EventBus[ClientMessage], lifecycleContainer: LifecycleContainer, timeProvider: Clock, vsClient: ViewServerClient) extends StrictLogging {

  private val dequeueThread = new LifeCycleRunner("clientDequeThread", () => dequeue(), minCycleTime = 50 )

  private val vpChangeThread = new LifeCycleRunner("vpChangeThread", () => sendVpUpdates(), minCycleTime = 200 )

  private val vpChangeRequests = new ConcurrentHashMap[String, ClientUpdateVPRange]()

  import io.venuu.vuu.client.ClientHelperFns._

  eventBus.register( {
      case msg: ClientOpenTreeNodeRequest =>
          openTreeNodeAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId, msg.treeKey)
      case msg: ClientCloseTreeNodeRequest =>
          closeTreeNodeAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId, msg.treeKey)
      case msg: ClientChangeViewPortRequest =>
        changeVpAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.viewPortId, msg.columns, msg.sortBy, msg.groupBy, msg.filterSpec, msg.aggregations)
      case msg: ClientGetTableMeta =>
        tableMetaAsync(principal.sessionId, principal.token, principal.user, msg.table, msg.requestId)
      case msg: ClientGetViewPortMenusRequest =>
        getViewPortMenusAsync(principal.sessionId, principal.token, principal.user, msg.vpId)
      case msg: ClientGetTableList =>
        tableListAsync(principal.sessionId, principal.token, principal.user)
      case msg: ClientRpcCall =>
        logger.info("making rpc call: " + msg)
        rpcCallAsync(principal.sessionId, principal.token, principal.user, msg.service, msg.method, msg.params, msg.module)
      case msg: Logon =>
        authAsync(msg.user, msg.password)
      case msg: ClientCreateViewPort =>
        createVpAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.table, msg.columns, sortBy = msg.sortBy, range = ViewPortRange(msg.from, msg.to), filterSpec = FilterSpec(msg.filter), groupBy = msg.groupBy)
      case msg: ClientRpcTableUpdate =>
        rpcTableUpdate(principal.sessionId, principal.token, principal.user, msg.table, msg.key, msg.data)
      case msg: ClientSetSelection =>
        setSelection(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId, msg.selection)
      case msg: ClientGetVisualLinks =>
        getVisualLinks(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId)
      case msg: ClientCreateVisualLink =>
        createVisualLink(principal.sessionId, principal.token, principal.user, msg.requestId, msg.childVpId, msg.parentVpId, msg.childColumnName, msg.parentColumnName)
      case msg: ClientEnableViewPort =>
        enableViewPort(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId)
      case msg: ClientDisableViewPort =>
        disableViewPort(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId)
      case msg: ClientRemoveViewPort =>
        removeViewPort(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId)
      case msg: ClientUpdateVPRange =>
        vpChangeRequests.put(msg.vpId, msg)
      case msg: ClientMenuSelectionRpcCall =>
        viewPortMenuSelectionRpcCall(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId, msg.rpcName)
      case msg: ClientMenuTableRpcCall =>
        viewPortMenuTableRpcCall(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId, msg.rpcName)
      case msg: ClientMenuCellRpcCall =>
        viewPortMenuCellRpcCall(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId, msg.rpcName, msg.rowKey, msg.field, msg.value)
      case msg: ClientMenuRowRpcCall =>
        viewPortMenuRowRpcCall(principal.sessionId, principal.token, principal.user,msg.requestId, msg.vpId, msg.rpcName, msg.rowKey, msg.row)
      case _ =>
  })

  @volatile private var principal: UserPrincipal = null

  private def sendVpUpdates() = {

    import scala.jdk.CollectionConverters.MapHasAsScala

    MapHasAsScala(vpChangeRequests).asScala.foreach({case(key, msg) =>
      vpChangeRequests.remove(key)
      logger.info(s"VP Range Change -> ${msg.from} to ${msg.to} ")
      changeVpRangeAsync(principal.sessionId, principal.token, principal.user, msg.vpId, ViewPortRange(msg.from, msg.to))
    })
  }


  private def dequeue() = {
    vsClient.awaitMsg match {
      case null =>
        //logger.info("No message or failed to deserialize")
      case msg: JsonViewServerMessage =>
        //logger.info("From Server: " + JsonUtil.toPrettyJson(msg))
        receiveFromServer(msg)
    }
  }

  val logReq = new LogAtFrequency(60000)

  def receiveFromServer(msg: JsonViewServerMessage): Unit = {

    msg.body match {
      case body: HeartBeat =>
        logger.info("[HB]")
        heartbeatRespAsync(principal.sessionId, principal.token, principal.user, body.ts)

      case body: AuthenticateSuccess =>
        logger.info("[AUTH] success")
        loginAsync(body.token, msg.user)

      case body: LoginSuccess =>
        principal = new UserPrincipal(msg.user, msg.token, msg.sessionId)
        logger.info(s"[LOGIN] success ${principal}")
        eventBus.publish(LogonSuccess(principal))

      case body: CreateViewPortSuccess =>
        logger.info("[VP] Create Success")
        eventBus.publish(ClientCreateViewPortSuccess(msg.requestId, body.viewPortId, body.columns, body.sort, body.groupBy, if(body.filterSpec == null) "" else body.filterSpec.filter))

      case body: GetTableListResponse =>
        logger.info("TABLELIST")
        eventBus.publish(ClientGetTableListResponse(msg.requestId, body.tables))

      case body: ChangeViewPortRangeSuccess =>
        logger.info(s"[VP] Range Resp ${body.from}->${body.to}")
        eventBus.publish(ClientChangeViewPortRangeSuccess(body.viewPortId, body.from, body.to))

      case body: OpenTreeNodeSuccess =>

      case body: CloseTreeNodeSuccess =>

      case body: TableRowUpdates =>

        //if(logReq.shouldLog()){
          //logger.info(s"[VP] updates ${body.rows.length} for ${body.rows(0).viewPortId} rowSize = ${body.rows(0).vpSize}")
          //body.rows.foreach(r => logger.info("ROW: ix {} key {}, vpSize {}, data {}", r.rowIndex, r.rowKey, r.vpSize, r.data))
        //logger.info(JsonVsSerializer.serialize(msg))
        //}


        //logger.info("Got table row updates: " + body.rows.size)
        body.rows.foreach(ru => eventBus.publish(ClientServerRowUpdate(ru.viewPortId, ru.rowIndex, ru.data.asInstanceOf[Array[AnyRef]], ru.vpSize, ru.selected)))

      case body: GetTableMetaResponse =>
        logger.info(s"[TABLEMETA] ${body.table} from server")
        eventBus.publish(ClientGetTableMetaResponse(msg.requestId, body.table, body.columns, body.dataTypes, body.key))

      case body: RpcSuccess =>
        logger.info("[RPC] success...")

      case body: ChangeViewPortSuccess =>
        eventBus.publish(ClientChangeViewPortSuccess(msg.requestId, body.viewPortId, body.columns, body.sort, body.groupBy, body.filterSpec))

      case body: SetSelectionSuccess =>
        logger.info("[SELECTION] success." + body.selection.mkString(",") )

      case body: GetViewPortVisualLinksResponse =>
        eventBus.publish(ClientGetVisualLinksResponse(msg.requestId, body.vpId, body.links))

      case body: CreateVisualLinkSuccess =>
        eventBus.publish(ClientCreateVisualLinkSuccess(msg.requestId, body.childVpId, body.parentVpId, body.childColumnName, body.parentColumnName))

      case body: ErrorResponse =>
        logger.info("[ERROR] " + body)

      case body: EnableViewPortSuccess =>
        logger.info("[Enable View Port Success] " + body)

      case body: EnableViewPortReject =>
        logger.info("[Enable View Port Reject] " + body)

      case body: DisableViewPortSuccess =>
        logger.info("[Disable View Port Success] " + body)

      case body: DisableViewPortReject =>
        logger.info("[Disable View Port Reject] " + body)

      case body: RemoveViewPortSuccess =>
        logger.info("[Remove View Port Success] " + body)

      case body: RemoveViewPortReject =>
        logger.info("[Remove View Port Reject] " + body)

      case body: RpcResponse =>
        logger.info("[RPC Response] " + body)
        eventBus.publish(ClientRpcResponse(msg.requestId, "", body.method, body.result, body.error))

      case body: GetViewPortMenusResponse =>
        logger.info("[ViewPort Menus] " + body)
        eventBus.publish(ClientGetViewPortMenusResponse(msg.requestId, body.vpId, body.menu))

      case body: ViewPortMenuRpcResponse =>
        logger.info("[ViewPort Menus Response] " + body)
        eventBus.publish(ClientMenuRpcResponse(msg.requestId, body.vpId, body.action))
    }
  }
}
