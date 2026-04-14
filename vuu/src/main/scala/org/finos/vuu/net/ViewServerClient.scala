package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.net.json.JsonSerializer
import org.finos.vuu.net.ws.WebSocketClient

import scala.util.{Failure, Success, Try}

trait ViewServerClient extends LifecycleEnabled {

  def isConnected: Boolean

  def send(msg: ViewServerMessage): Unit

  def awaitMsg: ViewServerMessage
}

class WebSocketViewServerClient(val ws: WebSocketClient)(implicit lifecycle: LifecycleContainer) extends ViewServerClient with StrictLogging {

  private val serializer = JsonSerializer[ViewServerMessage]()

  lifecycle(this).dependsOn(ws)

  override def doStart(): Unit = {
    while (!isConnected) {

    }

    logger.debug(s"[WSClient] Websocket is up.")
  }

  override def doStop(): Unit = {
    logger.debug(s"[WSClient] Websocket is stopping.")
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "wsViewServerClient"

  override def isConnected: Boolean = ws.getClientSession.exists(_.isConnected)

  override def send(msg: ViewServerMessage): Unit = {
    ws.getClientSession match {
      case Some(session) =>
        Try(serializer.serialize(msg)) match {
          case Failure(exception) =>
            logger.error(s"[WSClient] Failed to serialize $msg", exception)
          case Success(json) =>
            if (session.sendMessage(json)) {
              logger.trace(s"[WSClient] Sent: $json")
            } else {
              logger.error(s"[WSClient] Failed to send: $json")
            }
        }
      case None =>
        logger.error(s"[WSClient] No session. Failed to send: $msg")
    }
  }

  override def awaitMsg: ViewServerMessage = {
    ws.getClientSession.flatMap(_.awaitMessage()) match {
      case None =>
        logger.trace("[WSClient] No messages received")
        null
      case Some(msg) =>
        logger.trace(s"[WSClient] Received: $msg")
        Try(serializer.deserialize(msg)) match {
          case Success(vsMsg) => vsMsg
          case Failure(e) =>
            logger.error(s"""Could not deserialize "$msg", going to return null""", e)
            null
        }
    }
  }

}

