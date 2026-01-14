package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{Channel, ChannelFuture}
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.time.Clock
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.flowcontrol.{BatchSize, Disconnect, FlowController, SendHeartbeat}
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.{RowUpdateType, SizeUpdateType, ViewPortUpdate}

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.{CollectionHasAsScala, SetHasAsScala}

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
                            val user: VuuUser,
                            val session: ClientSessionId,
                            serverApi: ServerApi,
                            serializer: JsonVsSerializer,
                            flowController: FlowController,
                            sessionContainer: ClientSessionContainer,
                            moduleContainer: ModuleContainer)(implicit timeProvider: Clock) extends MessageHandler with StrictLogging {

  private val closeFuture: ChannelFuture = channel.closeFuture()

  closeFuture.addListener((f: ChannelFuture) => {
    logger.trace("Calling disconnect() from future callback")
    disconnect()
  })

  private def sendUpdatesInternal(updates: Seq[ViewPortUpdate], highPriority: Boolean = false) = {
    if (updates.nonEmpty) {

      logger.debug(s"ASYNC-SVR-OUT: Sending ${updates.size} updates")

      val formatted = formatDataOutbound(updates)

      val json = serializer.serialize(JsonViewServerMessage("", session.sessionId, formatted))

      logger.debug("ASYNC-SVR-OUT:" + json)

      channel.writeAndFlush(new TextWebSocketFrame(json))
    }
  }

  override def sendUpdates(): Unit = {

    flowController.shouldSend() match {
      case op: SendHeartbeat =>
        logger.debug(s"Sending heartbeat to session ${session.sessionId}")
        val json = serializer.serialize(JsonViewServerMessage("", session.sessionId, HeartBeat(timeProvider.now())))
        channel.writeAndFlush(new TextWebSocketFrame(json))
      case op: Disconnect =>
        logger.warn(s"Disconnecting session ${session.sessionId} because of missed heartbeats")
        disconnect()

      case BatchSize(size) =>
        val updates = outboundQueue.popUpTo(size)
        sendUpdatesInternal(updates)

    }
  }

  private def disconnect(): ChannelFuture = {
    logger.debug(s"Disconnecting session ${session.sessionId}")
    serverApi.disconnect(session)
    sessionContainer.remove(user, session)
    channel.disconnect()
    val closeResult = channel.close()
    logger.info(s"Disconnected session ${session.sessionId}")
    closeResult
  }

  protected def formatDataOutbound(outbound: Seq[ViewPortUpdate]): TableRowUpdates = {

    val updates = outbound.filter(vpu => vpu.vpRequestId == vpu.vp.getRequestId).flatMap(vp => formatOneRowUpdate(vp)).toArray
    //val updates = outbound.flatMap(vp => formatOneRowUpdate(vp)).toArray

    val updateId = RequestId.oneNew()

    TableRowUpdates(updateId, isLast = true, timeProvider.now(), updates)
  }

  protected def formatOneRowUpdate(update: ViewPortUpdate): Option[RowUpdate] = {

    update.vpUpdate match {
      case SizeUpdateType =>
        //logger.debug(s"SVR[VP] Size: vpid=${update.vp.id} size=${update.vp.size}")
        Some(RowUpdate(update.vpRequestId, update.vp.id, update.size, update.index, update.key.key, UpdateType.SizeOnly, timeProvider.now(), 0, Array.empty))

      case RowUpdateType =>

        //if viewport has changed while we're processing the queue
        if (!update.vp.getRange.contains(update.index)) {
          return None
        }

        val dataToSend = update.table.pullRowAsArray(update.key.key, update.vp.getColumns)

        val isSelected = if (update.vp.getSelection.contains(update.key.key)) 1 else 0

        if (dataToSend.length == 0) {
          None
        } else {
          Some(RowUpdate(update.vpRequestId, update.vp.id, update.size, update.index, update.key.key, UpdateType.Update, timeProvider.now(), isSelected, dataToSend))
        }
    }

  }

  override def handle(msg: ViewServerMessage): Option[ViewServerMessage] = {
    val ctx = RequestContext(msg.requestId, user, session, outboundQueue)

    flowController.process(msg)

    msg.body match {
      case req: ChangeViewPortRequest => serverApi.process(req)(ctx)
      case req: CreateViewPortRequest => serverApi.process(req)(ctx)
      case req: ChangeViewPortRange => serverApi.process(req)(ctx)
      case req: OpenTreeNodeRequest => serverApi.process(req)(ctx)
      case req: CloseTreeNodeRequest => serverApi.process(req)(ctx)
      case req: SelectRowRequest => serverApi.process(req)(ctx)
      case req: DeselectRowRequest => serverApi.process(req)(ctx)
      case req: SelectRowRangeRequest => serverApi.process(req)(ctx)
      case req: SelectAllRequest => serverApi.process(req)(ctx)
      case req: DeselectAllRequest => serverApi.process(req)(ctx)
      case req: GetTableList => serverApi.process(req)(ctx)
      case req: GetTableMetaRequest => serverApi.process(req)(ctx)
      case req: HeartBeatResponse => serverApi.process(req)(ctx)
      case req: RpcUpdate => serverApi.process(req)(ctx)
      case req: GetViewPortVisualLinksRequest => serverApi.process(req)(ctx)
      case req: CreateVisualLinkRequest => serverApi.process(req)(ctx)
      case req: RemoveViewPortRequest => serverApi.process(req)(ctx)
      case req: EnableViewPortRequest => serverApi.process(req)(ctx)
      case req: DisableViewPortRequest => serverApi.process(req)(ctx)
      case req: FreezeViewPortRequest => serverApi.process(req)(ctx)
      case req: UnfreezeViewPortRequest => serverApi.process(req)(ctx)
      case req: GetViewPortMenusRequest => serverApi.process(req)(ctx)
      case req: ViewPortMenuSelectionRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuRowRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuTableRpcCall => serverApi.process(req)(ctx)
      case req: ViewPortMenuCellRpcCall => serverApi.process(req)(ctx)
      case req: RemoveVisualLinkRequest => serverApi.process(req)(ctx)
      case req: RpcRequest => serverApi.process(req)(ctx)
    }
  }
}

case class ClientSessionId(sessionId: String, channelId: String) extends Ordered[ClientSessionId] {

  override def compare(that: ClientSessionId): Int =  {
    val comp = sessionId.compareTo(that.sessionId)
    if (comp != 0) comp else channelId.compareTo(that.channelId)
  }

}


