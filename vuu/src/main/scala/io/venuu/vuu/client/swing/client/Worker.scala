/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing.client

import java.util.concurrent.ConcurrentHashMap

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.net._
import io.venuu.vuu.viewport.ViewPortRange

case class UserPrincipal(user: String, token: String, sessionId: String)

class Worker(implicit eventBus: EventBus[ClientMessage], lifecycleContainer: LifecycleContainer, timeProvider: Clock, vsClient: ViewServerClient) extends StrictLogging {

  private val dequeueThread = new LifeCycleRunner("clientDequeThread", () => dequeue(), minCycleTime = 100 )

  private val vpChangeThread = new LifeCycleRunner("vpChangeThread", () => sendVpUpdates(), minCycleTime = 200 )

  private val vpChangeRequests = new ConcurrentHashMap[String, ClientUpdateVPRange]()

  import io.venuu.vuu.client.ClientHelperFns._

  eventBus.register( {
      case msg: ClientOpenTreeNodeRequest =>
          openTreeNodeAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId, msg.treeKey)
      case msg: ClientCloseTreeNodeRequest =>
          closeTreeNodeAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.vpId, msg.treeKey)
      case msg: ClientChangeViewPortRequest =>
        changeVpAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.viewPortId, msg.columns, msg.sortBy, msg.groupBy, msg.filterSpec)
      case msg: ClientGetTableMeta =>
        tableMetaAsync(principal.sessionId, principal.token, principal.user, msg.table, msg.requestId)
      case msg: ClientGetTableList =>
        tableListAsync(principal.sessionId, principal.token, principal.user)
      case msg: Logon =>
        authAsync(msg.user, msg.password)
      //case ur : UpdateRange => requests.put(current, ur)
      case msg: ClientCreateViewPort =>
        createVpAsync(principal.sessionId, principal.token, principal.user, msg.requestId, msg.table, msg.columns, sortBy = msg.sortBy, range = ViewPortRange(msg.from, msg.to), filterSpec = FilterSpec(msg.filter), groupBy = msg.groupBy)
      case msg: ClientRpcTableUpdate =>
        rpcTableUpdate(principal.sessionId, principal.token, principal.user, msg.table, msg.key, msg.data)

      case msg: ClientUpdateVPRange =>
        vpChangeRequests.put(msg.vpId, msg)

      case _ =>
  })

  @volatile private var principal: UserPrincipal = null

  private def sendVpUpdates() = {

    import scala.collection.JavaConversions._

    vpChangeRequests.foreach({case(key, msg) =>
      vpChangeRequests.remove(key)
      logger.warn(s"Client VP Range Change ${key} from ${msg.from} to ${msg.to} ")
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
        logger.info("HB")
        heartbeatRespAsync(principal.sessionId, principal.token, principal.user, body.ts)

      case body: AuthenticateSuccess =>
        logger.info("Auth successful, now logging in" + body)
        loginAsync(body.token, msg.user)

      case body: LoginSuccess =>
        principal = new UserPrincipal(msg.user, msg.token, msg.sessionId)
        logger.info(s"Logged in ${principal}")
        eventBus.publish(LogonSuccess(principal))

      case body: CreateViewPortSuccess =>
        logger.info("Got create viewport success")
        eventBus.publish(ClientCreateViewPortSuccess(msg.requestId, body.viewPortId, body.columns, body.sort, body.groupBy, if(body.filterSpec == null) "" else body.filterSpec.filter))

      case body: GetTableListResponse =>
        logger.info("Got table list from server")
        eventBus.publish(ClientGetTableListResponse(msg.requestId, body.tables))

      case body: ChangeViewPortRangeSuccess =>
        logger.info(s"Successfully changed viewport: " + body)
        //eventBus.pubish(ClientChange)

      case body: TableRowUpdates =>

        if(logReq.shouldLog()){
          logger.info(s"Got updates ${body.rows.length} for ${body.rows(0).viewPortId} rowSize = ${body.rows(0).vpSize} example below..")
          logger.info(JsonVsSerializer.serialize(msg))
        }


        //logger.info("Got table row updates: " + body.rows.size)
        body.rows.foreach(ru => eventBus.publish(ClientServerRowUpdate(ru.viewPortId, ru.rowIndex, ru.data.asInstanceOf[Array[AnyRef]], ru.vpSize)))

      case body: GetTableMetaResponse =>
        logger.info(s"Got column list for table ${body.table} from server")
        eventBus.publish(ClientGetTableMetaResponse(msg.requestId, body.table, body.columns, body.dataTypes, body.key))

      case body: RpcSuccess =>
        logger.info("Update success...")

      case body: ChangeViewPortSuccess =>
        eventBus.publish(ClientChangeViewPortSuccess(msg.requestId, body.viewPortId, body.columns, body.sort, body.groupBy, body.filterSpec))
    }
  }

}
