package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.time.Clock
import org.finos.vuu.client.messages.SessionId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import org.finos.vuu.viewport.ViewPortUpdate

case class RequestContext(requestId: String,
                          user: VuuUser,
                          session: ClientSessionId,
                          queue: PublishQueue[ViewPortUpdate])

class RequestProcessor(loginTokenService: LoginTokenService,
                       clientSessionContainer: ClientSessionContainer,
                       serverApi: ServerApi,
                       serializer: JsonVsSerializer,
                       moduleContainer: ModuleContainer,
                       flowControllerFactory: FlowControllerFactory,
                       vuuServerId: String
                      )(using timeProvider: Clock) extends StrictLogging {

  def handle(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {
    msg.body match {
      case body: LoginRequest =>
        loginTokenService.login(body) match {
          case Right(vuuUser) =>
            createSession(msg.requestId, vuuUser, clientSessionContainer, channel, vuuServerId)
          case Left(errorMessage) =>
            handleMessageWithNoSession(errorMessage, channel)
            None
        }
      case body => handleViewServerMessage(msg, channel)
    }
  }

  private def createSession(requestId: String,
                            user: VuuUser,
                            clientSessionContainer: ClientSessionContainer,
                            channel: Channel,
                            vuuServerId: String): Option[ViewServerMessage] = {

    logger.info(s"Creating session for ${user.name}")
    val session = SessionId.oneNew()
    val id = ClientSessionId(session, channel.id().asLongText())

    val handler = createMessageHandler(channel, id, user)
    clientSessionContainer.register(id, handler)
    logger.debug(s"Created session for user ${user.name} with $id")

    Some(JsonViewServerMessage(requestId, session, LoginSuccess(vuuServerId)))
  }

  private def createMessageHandler(channel: Channel, sessionId: ClientSessionId, user: VuuUser): MessageHandler = {
    val queue = OutboundRowPublishQueue()
    val flowController = flowControllerFactory.create()
    DefaultMessageHandler(channel, queue, user, sessionId, serverApi, serializer, flowController, clientSessionContainer, moduleContainer)
  }

  private def handleViewServerMessage(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {

    val sessionId = msgToSessionId(msg, channel)

    clientSessionContainer.getHandler(sessionId) match {
      case Some(handler) =>
        handler.handle(msg)
      case None =>
        handleMessageWithNoSession(msg, channel)
        None
    }
  }

  private def msgToSessionId(msg: ViewServerMessage, channel: Channel): ClientSessionId = {
    ClientSessionId(msg.sessionId, channel.id.asLongText())
  }

  private def handleMessageWithNoSession(msg: ViewServerMessage, channel: Channel): Unit = {
    channel.writeAndFlush(new TextWebSocketFrame("error, you have no session"))
    channel.close()
  }

  private def handleMessageWithNoSession(msg: String, channel: Channel): Unit = {
    channel.writeAndFlush(new TextWebSocketFrame(msg))
    channel.close()
  }

}
