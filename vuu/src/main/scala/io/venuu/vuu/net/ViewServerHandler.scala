package io.venuu.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import io.venuu.toolbox.json.JsonUtil
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.module.ModuleContainer
import io.venuu.vuu.net.json.Serializer

trait ViewServerHandlerFactory {
  def create(): ViewServerHandler
}

class ViewServerHandlerFactoryImpl(authenticator: Authenticator,
                                   tokenValidator: LoginTokenValidator, sessionContainer: ClientSessionContainer,
                                   serverApi: ServerApi, jsonVsSerializer: Serializer[String, MessageBody],
                                   moduleContainer: ModuleContainer)(implicit val timeProvider: Clock) extends ViewServerHandlerFactory {
  override def create(): ViewServerHandler = {
    val requestProcessor = new RequestProcessor(authenticator, tokenValidator, sessionContainer, serverApi, jsonVsSerializer, moduleContainer)
    new ViewServerHandler(jsonVsSerializer, requestProcessor)
  }
}


class ViewServerHandler(serializer: Serializer[String, MessageBody], processor: RequestProcessor) extends StrictLogging {

  def close(): Unit = {
    logger.info("closing session on disconnect")
    //processor.close()
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
