package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{ChannelHandlerContext, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.websocketx.{TextWebSocketFrame, WebSocketClientProtocolHandler}
import io.netty.util.AttributeKey

object WebSocketClientHandler {
  val sessionKey: AttributeKey[WebSocketClientSession] = AttributeKey.valueOf("websocket.session")
}

class WebSocketClientHandler(val session: WebSocketClientSession) extends SimpleChannelInboundHandler[TextWebSocketFrame] with StrictLogging {

  override def handlerAdded(ctx: ChannelHandlerContext): Unit = {
    ctx.channel().attr(WebSocketClientHandler.sessionKey).set(session)
  }

  override def userEventTriggered(ctx: ChannelHandlerContext, evt: AnyRef): Unit = {
    if (evt == WebSocketClientProtocolHandler.ClientHandshakeStateEvent.HANDSHAKE_COMPLETE) {
      session.markHandshakeComplete()
    }
  }

  override def channelRead0(ctx: ChannelHandlerContext, textWebSocketFrame: TextWebSocketFrame): Unit = {
    val text = textWebSocketFrame.text()
    logger.trace(s"[WS CLIENT] on msg $text")
    session.queueMessage(text)
  }

}
