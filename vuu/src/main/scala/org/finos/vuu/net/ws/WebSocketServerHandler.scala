package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{ChannelHandlerContext, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.websocketx.{TextWebSocketFrame, WebSocketFrame}
import org.finos.vuu.net.ViewServerHandler

class WebSocketServerHandler(val handler: ViewServerHandler) extends SimpleChannelInboundHandler[TextWebSocketFrame] with StrictLogging {
    
  @Override
  def channelRead0(ctx: ChannelHandlerContext, textWebSocketFrame: TextWebSocketFrame): Unit = {
    val text = textWebSocketFrame.text()
    logger.trace(s"[WS SERVER] on msg $text")
    handler.handle(text, ctx.channel())
  }

}
