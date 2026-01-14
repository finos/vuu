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

import scala.util.{Failure, Success, Try}

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
            sendMessageAndCloseChannel(errorMessage, channel)
            None
        }
      case body => Try(handleViewServerMessage(msg, channel)) match {
        case Success(viewServerMessage) => viewServerMessage
        case Failure(exception) =>
          closeChannel(exception, channel)
          None
      }
    }
  }

  private def createSession(requestId: String,
                            user: VuuUser,
                            clientSessionContainer: ClientSessionContainer,
                            channel: Channel,
                            vuuServerId: String): Option[ViewServerMessage] = {

    logger.debug(s"[SESSION] Creating session for ${user.name}. Remote address: ${channel.remoteAddress()}")
    val session = SessionId.oneNew()
    val id = ClientSessionId(session, channel.id().asLongText())
    val handler = createMessageHandler(channel, id, user)
    Try(clientSessionContainer.register(user, id, handler)) match {
      case Success(value) =>
        logger.info(s"[SESSION] Created session for user ${user.name} with id ${id.sessionId}. Remote address: ${channel.remoteAddress()}")
        Some(JsonViewServerMessage(requestId, session, LoginSuccess(vuuServerId)))
      case Failure(exception) =>
        logger.warn(s"[SESSION] Failed to create session for user ${user.name}", exception)
        closeChannel(exception, channel)
        None
    }
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
        handleMessageWithInvalidSession(sessionId, channel)
        None
    }
  }

  private def msgToSessionId(msg: ViewServerMessage, channel: Channel): ClientSessionId = {
    ClientSessionId(msg.sessionId, channel.id.asLongText())
  }

  private def handleMessageWithInvalidSession(requestSession: ClientSessionId, channel: Channel): Unit = {
    val channelHasSession = clientSessionContainer.getSessions().exists(p => p.channelId == requestSession.channelId)
    if (channelHasSession) {
      logger.error(s"[SESSION] Incorrect session on request. Remote address: ${channel.remoteAddress()}")
    } else {
      logger.error(s"[SESSION] Channel does not have a valid session. Remote address: ${channel.remoteAddress()}")
    }
    sendMessageAndCloseChannel("Invalid session", channel)
  }

  private def closeChannel(e: Throwable, channel: Channel): Unit = {
    logger.error(s"[SESSION] Internal server error. Remote address: ${channel.remoteAddress()}", e)
    sendMessageAndCloseChannel("Internal server error", channel)
  }

  private def sendMessageAndCloseChannel(msg: String, channel: Channel): Unit = {
    channel.writeAndFlush(new TextWebSocketFrame(msg))
    channel.close()
  }

}
