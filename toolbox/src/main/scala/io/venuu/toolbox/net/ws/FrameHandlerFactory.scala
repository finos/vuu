package io.venuu.toolbox.net.ws

import io.netty.channel.ChannelHandlerContext
import io.netty.handler.codec.http.websocketx.{BinaryWebSocketFrame, TextWebSocketFrame}

trait FrameHandler{
  def handle(text: TextWebSocketFrame, context: ChannelHandlerContext): Unit
  def handle(binary: BinaryWebSocketFrame, context: ChannelHandlerContext): Unit
}

/**
  * Created by chris on 30/04/2016.
  */
trait FrameHandlerFactory {
  def create(ctx: ChannelHandlerContext): FrameHandler
}
