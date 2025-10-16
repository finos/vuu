package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{ChannelHandlerContext, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.websocketx.{TextWebSocketFrame, WebSocketFrame}
import org.finos.vuu.net.ViewServerHandler

/**
 * Handles messages
 */
class WebSocketServerHandler(val handler: ViewServerHandler) extends SimpleChannelInboundHandler[WebSocketFrame] with StrictLogging {

  @Override
  def channelRead0(ctx: ChannelHandlerContext, webSocketFrame: WebSocketFrame): Unit = {
    webSocketFrame match {

      case text: TextWebSocketFrame =>
        val request = text.text()
        logger.trace("[WS SERVER] on msg " + request)
        handler.handle(request, ctx.channel())

      case _ =>
        val message = "Unsupported frame type: " + webSocketFrame.getClass.getName;
        throw new UnsupportedOperationException(message);
    }
  }

  override def exceptionCaught(ctx: ChannelHandlerContext, cause: Throwable): Unit = {
    logger.warn("Exception: Closing context", cause)
    ctx.close();
  }

}
