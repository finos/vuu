package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.time.Clock
import org.finos.vuu.client.messages.SessionId
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.Serializer
import org.finos.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import org.finos.vuu.viewport.ViewPortUpdate

case class RequestContext(requestId: String, session: ClientSessionId,
                          queue: PublishQueue[ViewPortUpdate],
                          token: String)


class RequestProcessor(authenticator: Authenticator,
                       tokenValidator: LoginTokenValidator,
                       clientSessionContainer: ClientSessionContainer,
                       serverApi: ServerApi,
                       serializer: Serializer[String, MessageBody],
                       moduleContainer: ModuleContainer,
                       flowControllerFactory: FlowControllerFactory,
                       vuuServerId: String
                      )(using timeProvider: Clock) extends StrictLogging {

  @volatile private var session: ClientSessionId = null

  def handle(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {
    msg.body match {
      case body: LoginRequest =>
        tokenValidator.login(body, vuuServerId).body match {
          case success: LoginSuccess =>
            createSession(msg.requestId, body, clientSessionContainer, channel, vuuServerId)
          case failure: LoginFailure =>
            handleMessageWithNoSession(failure.errorMsg, channel)
            None
        }
      case body => handleViewServerMessage(msg, channel)
    }
  }

  private def createSession(
                               requestId: String,
                               request: LoginRequest,
                               clientSessionContainer: ClientSessionContainer,
                               channel: Channel,
                               vuuServerId: String): Option[ViewServerMessage] = {

    val session = SessionId.oneNew()
    val user = request.user

    val id = ClientSessionId(session, user)

    logger.debug(s"Creating Session for user ${user} $id ")

    val handler = createMessageHandler(channel, id)

    clientSessionContainer.register(id, handler)

    Some(JsonViewServerMessage(requestId, session, request.token, request.user, LoginSuccess(request.token, vuuServerId)))
  }

  private def createMessageHandler(channel: Channel, sessionId: ClientSessionId): MessageHandler = {
    val queue = OutboundRowPublishQueue()
    val flowController = flowControllerFactory.create()
    DefaultMessageHandler(channel, queue, sessionId, serverApi, serializer, flowController, clientSessionContainer, moduleContainer)
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
    ClientSessionId(msg.sessionId, msg.user)
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
