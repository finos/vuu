package org.finos.vuu.net.flowcontrol

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.net.{ClientSessionId, ViewServerMessage}

trait FlowControlOp

case class SendHeartbeat() extends FlowControlOp

case class BatchSize(size: Int) extends FlowControlOp

case class Disconnect() extends FlowControlOp

trait FlowController {
  def process(msg: ViewServerMessage): Unit

  def shouldSend(): FlowControlOp
}

case class FlowControllerFactory(hasHeartbeat: Boolean)(implicit timeProvider: Clock) {
  def create(sessionId: ClientSessionId): FlowController = {
    if (hasHeartbeat)
      DefaultFlowController(sessionId)
    else
      NoHeartbeatFlowController
  }
}

private case class DefaultFlowController(sessionId: ClientSessionId)(implicit timeProvider: Clock) extends FlowController with StrictLogging {

  @volatile private var lastMsgTime: Long = -1
  @volatile private var lastHeartBeatSentTime: Long = -1

  override def process(msg: ViewServerMessage): Unit = {
    lastMsgTime = timeProvider.now()
  }

  override def shouldSend(): FlowControlOp = {
    val currentTime = timeProvider.now()
    val timeSinceLastMessage = if (lastMsgTime == -1) -1 else currentTime - lastMsgTime
    val timeSinceLastHeartbeat = currentTime - lastHeartBeatSentTime

    if (shouldSendHeartbeat(timeSinceLastMessage, timeSinceLastHeartbeat))
      sendHeartbeat()
    else if (shouldDisconnect(timeSinceLastMessage))
      Disconnect()
    else
      BatchSize(300)
  }

  private def shouldSendHeartbeat(timeSinceLastMessage: Long, timeSinceLastHeartbeat: Long): Boolean = {
    if (timeSinceLastMessage == -1) true
    else if (timeSinceLastHeartbeat < 1_000) false
    else {
      if (timeSinceLastMessage > 10_000 && timeSinceLastMessage <= 15_000) {
        logger.warn(s"[SESSION] Session ${sessionId.sessionId} has not responded for ${timeSinceLastMessage}ms")
      }
      timeSinceLastMessage > 5_000 && timeSinceLastMessage <= 15_000
    }
  }

  private def sendHeartbeat(): SendHeartbeat = {
    lastHeartBeatSentTime = timeProvider.now()
    SendHeartbeat()
  }

  private def shouldDisconnect(timeSinceLastMessage: Long): Boolean = {
    timeSinceLastMessage > 15_000
  }
}

object NoHeartbeatFlowController extends FlowController {
  override def process(msg: ViewServerMessage): Unit = {
    //nothing to do here
  }

  override def shouldSend(): FlowControlOp = {
    BatchSize(300)
  }
}
