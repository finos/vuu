package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.JsonVsSerializer

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
    val serializer = JsonVsSerializer()
    val requestProcessor = new RequestProcessor(loginTokenService, sessionContainer, serverApi, serializer,
      moduleContainer, flowControllerFactory, vuuServerId)
    new ViewServerHandler(serializer, requestProcessor)
  }
}

class ViewServerHandler(serializer: JsonVsSerializer, processor: RequestProcessor) extends StrictLogging {

  def close(): Unit = {
    logger.debug("closing session on disconnect")
  }

  def handle(inbound: String, channel: Channel): Unit = {
    val json = serializer.deserialize(inbound)
    logger.debug("SVR IN:" + JsonUtil.toRawJson(json))

    val response = processor.handle(json, channel)

    response.foreach(resp => {
      logger.debug("SVR OUT:" + JsonUtil.toRawJson(resp))
      channel.writeAndFlush(TextWebSocketFrame(serializer.serialize(resp)))
    })

  }
}
