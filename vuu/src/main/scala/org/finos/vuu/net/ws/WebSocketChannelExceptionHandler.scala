package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{ChannelHandlerContext, ChannelInboundHandlerAdapter}

class WebSocketChannelExceptionHandler extends ChannelInboundHandlerAdapter with StrictLogging {

  override def exceptionCaught(ctx: ChannelHandlerContext, cause: Throwable): Unit = {
    logger.error("Exception caught. Closing.", cause)
    ctx.close()
  }

}
