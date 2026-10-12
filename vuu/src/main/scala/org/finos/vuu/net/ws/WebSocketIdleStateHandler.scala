package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.ChannelHandlerContext
import io.netty.handler.timeout.{IdleState, IdleStateEvent, IdleStateHandler}

import java.time.Duration
import java.util.concurrent.TimeUnit

class WebSocketIdleStateHandler(readerIdleTime: Duration)
  extends IdleStateHandler(readerIdleTime.toSeconds, 0L, 0L, TimeUnit.SECONDS) with StrictLogging {

  override def channelIdle(ctx: ChannelHandlerContext, evt: IdleStateEvent): Unit = {
    super.channelIdle(ctx, evt)
    if (evt.state() == IdleState.READER_IDLE || evt.state() == IdleState.ALL_IDLE) {
      val remoteAddress = Option(ctx.channel()).map(_.remoteAddress()).getOrElse("unknown")
      logger.warn(s"[CHANNEL] ${evt.state()} timeout exceeded. Remote address: $remoteAddress")
      ctx.close()
    }
  }
}