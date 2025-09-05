package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import org.finos.toolbox.time.Clock
import org.finos.vuu.client.messages.SessionId
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.net.flowcontrol.{DefaultFlowController, FlowController, FlowControllerFactory}
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
                      )(implicit timeProvider: Clock) extends StrictLogging {

  @volatile private var session: ClientSessionId = null

  def handle(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {

    msg.body match {
      case body: AuthenticateRequest =>
        authenticator.authenticate(body.username, body.password)
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

  protected def createSession(
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


  protected def createMessageHandler(channel: Channel, sessionId: ClientSessionId): MessageHandler = {
    val queue = new OutboundRowPublishQueue()
    val flowController = flowControllerFactory.create()
    new DefaultMessageHandler(channel, queue, sessionId, serverApi, serializer, flowController, clientSessionContainer, moduleContainer)
  }

  protected def handleViewServerMessage(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {

    val sessionId = msgToSessionId(msg)

    clientSessionContainer.getHandler(sessionId) match {
      case Some(handler) =>
        handler.handle(msg)
      case None =>
        handleMessageWithNoSession(msg, channel)
        None
    }
  }

  protected def msgToSessionId(msg: ViewServerMessage): ClientSessionId = {
    ClientSessionId(msg.sessionId, msg.user)
  }

  protected def handleMessageWithNoSession(msg: ViewServerMessage, channel: Channel): Unit = {
    channel.writeAndFlush(new TextWebSocketFrame("error, you have no session"))
    channel.close()
  }

  protected def handleMessageWithNoSession(msg: String, channel: Channel): Unit = {
    channel.writeAndFlush(new TextWebSocketFrame(msg))
    channel.close()
  }

}
