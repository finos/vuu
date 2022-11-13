package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.json.{CoreJsonSerializationMixin, Serializer}
import org.finos.vuu.net.rpc.JsonSubTypeRegistry
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.viewport.{ViewPortAction, ViewPortActionMixin}
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

import scala.util.{Failure, Success, Try}
trait ViewServerClient extends LifecycleEnabled {
  def send(msg: ViewServerMessage): Unit

  def awaitMsg: ViewServerMessage
}

class WebSocketViewServerClient(ws: WebSocketClient, serializer: Serializer[String, MessageBody])(implicit lifecycle: LifecycleContainer) extends ViewServerClient with StrictLogging {

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  lifecycle(this).dependsOn(ws)

  override def doStart(): Unit = {
    while (!ws.canWrite()) {

    }

    logger.info("Websocket should be up.")
  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "wsViewServerClient"

  override def send(msg: ViewServerMessage): Unit = {
    val json = serializer.serialize(msg)
    ws.write(json)
  }

  override def awaitMsg: ViewServerMessage = {
    val msg = ws.awaitMessage()
    if (msg == null) {
      logger.info("no messages")
      null
    }
    else {
      Try(serializer.deserialize(msg)) match {
        case Success(vsMsg) => vsMsg
        case Failure(e) =>
          logger.error(s"could not deserialize ${msg} going to return null", e)
          null
      }
    }
  }
}

