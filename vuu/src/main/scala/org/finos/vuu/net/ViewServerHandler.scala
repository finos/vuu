package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.Serializer

trait ViewServerHandlerFactory {
  def create(): ViewServerHandler
}

class ViewServerHandlerFactoryImpl(authenticator: Authenticator,
                                   tokenValidator: LoginTokenValidator, sessionContainer: ClientSessionContainer,
                                   serverApi: ServerApi, jsonVsSerializer: Serializer[String, MessageBody],
                                   moduleContainer: ModuleContainer,
                                   flowControllerFactory: FlowControllerFactory,
                                   vuuServerId: String,
                                  )(implicit val timeProvider: Clock) extends ViewServerHandlerFactory {
  override def create(): ViewServerHandler = {
    val requestProcessor = new RequestProcessor(authenticator, tokenValidator, sessionContainer, serverApi, jsonVsSerializer, moduleContainer, flowControllerFactory, vuuServerId)
    new ViewServerHandler(jsonVsSerializer, requestProcessor)
  }
}


class ViewServerHandler(serializer: Serializer[String, MessageBody], processor: RequestProcessor) extends StrictLogging {

  def close(): Unit = {
    logger.debug("closing session on disconnect")
  }

  def handle(text: String, channel: Channel): Unit = {

    val json = serializer.deserialize(text)

    logger.debug("SVR IN:" + JsonUtil.toRawJson(json))

    val response = processor.handle(json, channel)

    response.foreach(msg => logger.debug("SVR OUT:" + JsonUtil.toRawJson(msg)))

    response.foreach(resp => {
      channel.writeAndFlush(new TextWebSocketFrame(serializer.serialize(resp)))
    })

  }
}
