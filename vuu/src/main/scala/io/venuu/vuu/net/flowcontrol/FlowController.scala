package io.venuu.vuu.net.flowcontrol

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.net.ViewServerMessage

trait FlowControlOp

case class SendHeartbeat() extends FlowControlOp

case class BatchSize(size: Int) extends FlowControlOp

case class Disconnect() extends FlowControlOp

/**
 * Created by chris on 10/01/2016.
 */
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
