package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.VsJsonSerializer

trait ViewServerHandlerFactory {
  def create(): ViewServerHandler
}

class ViewServerHandlerFactoryImpl(loginTokenService: LoginTokenService,
                                   sessionContainer: ClientSessionContainer,
                                   serverApi: ServerApi,
                                   moduleContainer: ModuleContainer,
                                   flowControllerFactory: FlowControllerFactory,
                                   vuuServerId: String,
                                  )(implicit val timeProvider: Clock) extends ViewServerHandlerFactory {
  override def create(): ViewServerHandler = {
    val serializer = VsJsonSerializer()
    val requestProcessor = new RequestProcessor(loginTokenService, sessionContainer, serverApi, serializer,
      moduleContainer, flowControllerFactory, vuuServerId)
    new ViewServerHandler(serializer, requestProcessor)
  }
}

class ViewServerHandler(serializer: VsJsonSerializer, processor: RequestProcessor) extends StrictLogging {

  def close(): Unit = {
    logger.debug("closing session on disconnect")
  }

  def handle(inbound: String, channel: Channel): Unit = {
    val viewServerMessage: ViewServerMessage = serializer.deserialize(inbound)
    logger.debug(s"SVR IN: ${serializer.serialize(viewServerMessage)}")

    val response: Option[ViewServerMessage] = processor.handle(viewServerMessage, channel)

    response.foreach(resp => {
      val serializedResponse = serializer.serialize(resp)
      logger.debug(s"SVR OUT: $serializedResponse")
      channel.writeAndFlush(TextWebSocketFrame(serializedResponse))
    })

  }
}
