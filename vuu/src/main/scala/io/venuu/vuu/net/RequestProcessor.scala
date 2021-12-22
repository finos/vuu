package io.venuu.vuu.net

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages.SessionId
import io.venuu.vuu.core.module.ModuleContainer
import io.venuu.vuu.net.flowcontrol.DefaultFlowController
import io.venuu.vuu.net.json.Serializer
import io.venuu.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import io.venuu.vuu.viewport.ViewPortUpdate

case class RequestContext(requestId: String, session: ClientSessionId,
                          queue: PublishQueue[ViewPortUpdate], highPriorityQueue: PublishQueue[ViewPortUpdate],
                          token: String)

/**
 * Created by chris on 12/11/2015.
 */
class RequestProcessor(authenticator: Authenticator,
                       tokenValidator: LoginTokenValidator,
                       clientSessionContainer: ClientSessionContainer,
                       serverApi: ServerApi,
                       serializer: Serializer[String, MessageBody],
                       moduleContainer: ModuleContainer
                      )(implicit timeProvider: Clock) extends StrictLogging {

  @volatile private var session: ClientSessionId = null

  def handle(msg: ViewServerMessage, channel: Channel): Option[ViewServerMessage] = {


    msg.body match {
      case body: AuthenticateRequest =>
        authenticator.authenticate(body.username, body.password)
      case body: LoginRequest =>
        tokenValidator.login(body) match {
          case Left(accept) =>
            createSession(msg.requestId, body, clientSessionContainer, channel)
          case Right(errorMsg) =>
            handleMessageWithNoSession(errorMsg, channel)
            None
        }
      case body => handleViewServerMessage(msg, channel)
    }
  }

  protected def createSession(requestId: String, request: LoginRequest, clientSessionContainer: ClientSessionContainer, channel: Channel): Option[ViewServerMessage] = {

    val session = SessionId.oneNew()
    val user = request.user

    val id = ClientSessionId(session, user)

    logger.info(s"Creating Session for user ${user} $id ")

    val handler = createMessageHandler(channel, id)

    clientSessionContainer.register(id, handler)

    Some(JsonViewServerMessage(requestId, session, request.token, request.user, LoginSuccess(request.token)))
  }


  protected def createMessageHandler(channel: Channel, sessionId: ClientSessionId): MessageHandler = {
    val queue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()
    val flowController = new DefaultFlowController
    new DefaultMessageHandler(channel, queue, highPriorityQueue, sessionId, serverApi, serializer, flowController, clientSessionContainer, moduleContainer)
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
