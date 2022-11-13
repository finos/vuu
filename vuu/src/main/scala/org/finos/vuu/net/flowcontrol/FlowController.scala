package org.finos.vuu.net.flowcontrol

import org.finos.vuu.net.ViewServerMessage
import org.finos.toolbox.time.Clock

trait FlowControlOp

case class SendHeartbeat() extends FlowControlOp

case class BatchSize(size: Int) extends FlowControlOp

case class Disconnect() extends FlowControlOp

trait FlowController {
  def process(msg: ViewServerMessage)

  def shouldSend(): FlowControlOp
}

class DefaultFlowController(implicit timeProvider: Clock) extends FlowController {

  @volatile private var lastMsgTime: Long = -1
  @volatile private var lastHeartBeatSentTime: Long = -1

  override def process(msg: ViewServerMessage): Unit = {
    lastMsgTime = timeProvider.now()
  }

  override def shouldSend(): FlowControlOp = {

    if (lastMsgTime == -1 || (noMsgIn5Seconds() && lastHeartbeatMoreThanSecondAgo()))
      sendHearbeat()
    else if (noMsgIn10Seconds())
      Disconnect()
    else
      BatchSize(300)
  }

  private def sendHearbeat() = {
    lastHeartBeatSentTime = timeProvider.now()
    SendHeartbeat()
  }

  private def lastHeartbeatMoreThanSecondAgo(): Boolean = {
    (timeProvider.now() - lastHeartBeatSentTime) > 1000
  }


  private def noMsgIn10Seconds(): Boolean = {
    val diff = (timeProvider.now() - lastMsgTime)
    diff > 10000
  }

  private def noMsgIn5Seconds(): Boolean = {
    val diff = (timeProvider.now() - lastMsgTime)
    diff > 5000 && diff < 10000
  }

}
