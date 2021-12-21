package io.venuu.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{Channel, ChannelFuture, ChannelFutureListener}
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages.RequestId
import io.venuu.vuu.core.module.ModuleContainer
import io.venuu.vuu.core.table.EmptyRowData
import io.venuu.vuu.net.flowcontrol.{BatchSize, Disconnect, FlowController, SendHeartbeat}
import io.venuu.vuu.net.json.Serializer
import io.venuu.vuu.util.PublishQueue
import io.venuu.vuu.viewport.{RowUpdateType, SizeUpdateType, ViewPortUpdate}

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

trait InboundMessageHandler {
  def handle(msg: ViewServerMessage): Option[ViewServerMessage]
}

trait OutboundMessageHandler {
  def sendUpdates(): Unit
}

trait MessageHandler extends InboundMessageHandler with OutboundMessageHandler {
  def channel: Channel

  def outboundQueue: PublishQueue[ViewPortUpdate]

}

class DefaultMessageHandler(val channel: Channel,
                            val outboundQueue: PublishQueue[ViewPortUpdate],
                            val highPriorityQueue: PublishQueue[ViewPortUpdate],
                            val session: ClientSessionId,
                            serverApi: ServerApi,
                            serializer: Serializer[String, MessageBody],
                            flowController: FlowController,
                            sessionContainer: ClientSessionContainer,
                            moduleContainer: ModuleContainer)(implicit timeProvider: Clock) extends MessageHandler with StrictLogging {

  val closeFuture = channel.closeFuture()

  closeFuture.addListener(new ChannelFutureListener {
    override def operationComplete(f: ChannelFuture): Unit = {
      logger.info("Calling disconnect() from future callback")
      disconnect()
    }
  })


  private def hasHighPriorityUpdates: Boolean = {
    highPriorityQueue.length > 0
  }

  private def sendUpdatesInternal(updates: Seq[ViewPortUpdate], highPriority: Boolean = false) = {
    if (!updates.isEmpty) {

      val formatted = formatDataOutbound(updates)

      val json = serializer.serialize(JsonViewServerMessage("", session.sessionId, "", session.user, formatted))

      logger.debug("ASYNC-SVR-OUT:" + json)

      channel.writeAndFlush(new TextWebSocketFrame(json))
    }
  }

  override def sendUpdates(): Unit = {

    //TODO implement flow controller

    flowController.shouldSend() match {
      case op: SendHeartbeat =>
        logger.debug("Sending heartbeat")
        val json = serializer.serialize(JsonViewServerMessage("NA", session.sessionId, "", session.user, HeartBeat(timeProvider.now())))
        channel.writeAndFlush(new TextWebSocketFrame(json))
      case op: Disconnect =>

        logger.warn("Disconnecting due to flow controller")
        disconnect()

      case BatchSize(size) =>
        if (hasHighPriorityUpdates) {
          val updates = highPriorityQueue.popUpTo(size)
          sendUpdatesInternal(updates, highPriority = true)
          val remaining = size - updates.size
          if (remaining > 0) {
            val lpUpdates = outboundQueue.popUpTo(remaining)
            sendUpdatesInternal(lpUpdates, highPriority = true)
          }

        } else {
          val updates = outboundQueue.popUpTo(size)
          sendUpdatesInternal(updates)
        }
    }
  }

  def disconnect() = {
    serverApi.disconnect(session)
    sessionContainer.remove(session)
    channel.disconnect()
    channel.close()
  }

  protected def formatDataOutbound(outbound: Seq[ViewPortUpdate]): TableRowUpdates = {

    val updates = outbound.filter(vpu => vpu.vpRequestId == vpu.vp.getRequestId).flatMap(vp => formatOneRowUpdate(vp)).toArray

    val updateId = RequestId.oneNew()

    TableRowUpdates(updateId, true, timeProvider.now, updates)
  }

  protected def formatOneRowUpdate(update: ViewPortUpdate): Option[RowUpdate] = {

    update.vpUpdate match {
      case SizeUpdateType => {
        //logger.debug(s"SVR[VP] Size: vpid=${update.vp.id} size=${update.vp.size}")
        Some(RowUpdate(update.vpRequestId, update.vp.id, update.size, update.index, update.key.key, UpdateType.SizeOnly, timeProvider.now(), 0, Array.empty))
      }

      case RowUpdateType =>

        //if viewport has changed while we're processing the queue
        if (!update.vp.getRange.contains(update.index)) {
          return None
        }

        val dataToSend = update.table.pullRowAsArray(update.key.key, update.vp.getColumns)

//        if(dataToSendAsRows == EmptyRowData || dataToSendAsRows.size() == 0){
//            logger.warn(s"SVR: Row [${update.key.key} empty, not sending")
//            None
//        }else{
          //val dataToSend = dataToSendAsRows.toArray(update.vp.getColumns)

          //        if (dataToSend.size > 0 && (dataToSend(0) == null || dataToSend(0) == "")) {
          //          println("ChrisChris>>" + update.table.name + " " + update.key.key + " " + update.index + " data: " + dataToSend.mkString(","))
          //          None
          //        }else{

          val isSelected = if (update.vp.getSelection.contains(update.key.key)) 1 else 0

          if (dataToSend.length == 0) {
            None
          } else {
            Some(RowUpdate(update.vpRequestId, update.vp.id, update.size, update.index, update.key.key, UpdateType.Update, timeProvider.now(), isSelected, dataToSend))
          }
        //}

      //  }

      //        val dataToSendAsRow = update.table.pullRow(update.key.key, update.vp.getColumns)
//
//        if(dataToSendAsRow.size() == 0){
//          logger.warn("ChrisChris4>>" + update.table.name + " " + update.key.key + " " + update.index + " data: " + dataToSendAsRow)
//          None
//        }else{
//
//        val dataToSend = dataToSendAsRow.toArray(update.vp.getColumns)// update.table.pullRowAsArray(update.key.key, update.vp.getColumns)
//
////        if (dataToSend.length > 0 && dataToSend(0) == "") {
////          logger.warn("ChrisChris>>" + update.table.name + " " + update.key.key + " " + update.index + " data: " + dataToSend.mkString(","))
////          None
////        }
////        else{
//        val isSelected = if (update.vp.getSelection.contains(update.key.key)) 1 else 0
//
//        if (dataToSend.size == 0) {
//          logger.warn("ChrisChris2>>" + update.table.name + " " + update.key.key + " " + update.index + " data: " + dataToSend.mkString(","))
//          None
//        } else {
//          Some(RowUpdate(update.vp.id, update.size, update.index, update.key.key, UpdateType.Update, timeProvider.now(), isSelected, dataToSend))
//        }
//        }
    }

  }

  private def isEmpty(data: Array[Any]): Boolean = {
    var isEmpty = true
    for(datum <- data if datum != ""){
      isEmpty = false
    }
    isEmpty
  }


  override def handle(msg: ViewServerMessage): Option[ViewServerMessage] = {
    val ctx = new RequestContext(msg.requestId, session, outboundQueue, highPriorityQueue, msg.token)

    flowController.process(msg)

    msg.body match {
      case req: ChangeViewPortRequest => serverApi.process(req)(ctx)
      case req: CreateViewPortRequest => serverApi.process(req)(ctx)
      case req: ChangeViewPortRange => serverApi.process(req)(ctx)
      case req: OpenTreeNodeRequest => serverApi.process(req)(ctx)
      case req: CloseTreeNodeRequest => serverApi.process(req)(ctx)
      case req: SetSelectionRequest => serverApi.process(req)(ctx)
      case req: GetTableList => serverApi.process(req)(ctx)
      case req: GetTableMetaRequest => serverApi.process(req)(ctx)
      case req: HeartBeatResponse => serverApi.process(req)(ctx)
      case req: RpcUpdate => serverApi.process(req)(ctx)
      case req: RpcCall => handleModuleRpcMsg(msg, req)(ctx)
      case req: GetViewPortVisualLinksRequest => serverApi.process(req)(ctx)
      case req: CreateVisualLinkRequest => serverApi.process(req)(ctx)
      case req: RemoveViewPortRequest => serverApi.process(req)(ctx)
      case req: EnableViewPortRequest => serverApi.process(req)(ctx)
      case req: DisableViewPortRequest => serverApi.process(req)(ctx)
      case req: GetViewPortMenusRequest => serverApi.process(req)(ctx)
      case req: ViewPortMenuSelectionRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuRowRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuTableRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuCellRpcCall => serverApi.process(req)(ctx)
    }
  }

  def handleModuleRpcMsg(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    moduleContainer.get(msg.module) match {
      case Some(module) =>
        module.rpcHandlerByService(rpc.service) match {
          case Some(service) =>
            service.processRpcCall(msg, rpc)(ctx)
          case None =>
            logger.error(s"Could not find impl for service ${rpc.service}")
            Some(VsMsg(msg.requestId, msg.sessionId, msg.token, msg.user,
              RpcResponse(rpc.method, null, Error(s"Handler not found for rpc call ${rpc} for service ${rpc.service} in module ${msg.module}", -1)))
            )
        }
      case None =>
        Some(VsMsg(msg.requestId, msg.sessionId, msg.token, msg.user,
          RpcResponse(rpc.method, null, Error(s"Handler not found for rpc call ${rpc} in module ${msg.module}", -1))))
    }
  }

}

case class ClientSessionId(sessionId: String, user: String) extends Ordered[ClientSessionId] {
  override def equals(obj: scala.Any): Boolean = {
    if (obj == null) false
    else if (canEqual(obj)) {
      sessionId == obj.asInstanceOf[ClientSessionId].sessionId
    } else {
      false
    }
  }

  override def hashCode(): Int = sessionId.hashCode

  override def compare(that: ClientSessionId): Int = sessionId.compareTo(that.sessionId)
}

trait ClientSessionContainer {

  def register(sessionId: ClientSessionId, messageHandler: MessageHandler)

  //def addConnection(session: ClientSessionId, channel: Channel, handler: InboundMessageHandler): Unit
  def getHandler(sessionId: ClientSessionId): Option[MessageHandler]

  def remove(sessionId: ClientSessionId): Unit
}

class ClientSessionContainerImpl() extends ClientSessionContainer with StrictLogging {

  private val sessions = new ConcurrentHashMap[ClientSessionId, MessageHandler]()

  override def remove(sessionId: ClientSessionId): Unit = {
    logger.info(s"Removing client session $sessionId")
    sessions.remove(sessionId)
  }

  override def register(sessionId: ClientSessionId, messageHandler: MessageHandler): Unit = {
    sessions.put(sessionId, messageHandler)
  }

  //def addConnection(session: ClientSessionId, channel: Channel, handler: InboundMessageHandler): Unit
  override def getHandler(sessionId: ClientSessionId): Option[MessageHandler] = {
    val handler = sessions.get(sessionId)
    Option(handler)
  }

  def runOnce(): Unit = {
    SetHasAsScala(sessions.entrySet()).asScala.foreach(entry => entry.getValue.sendUpdates())
  }
}


trait ClientConnectionCreator {
  def accept()
}


