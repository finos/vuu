package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{Channel, ChannelHandlerContext, ChannelPromise, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.FullHttpResponse
import io.netty.handler.codec.http.websocketx.{CloseWebSocketFrame, PongWebSocketFrame, TextWebSocketFrame, WebSocketClientHandshaker, WebSocketFrame}
import io.netty.util.CharsetUtil

import java.util.concurrent.{ArrayBlockingQueue, TimeUnit}
import scala.concurrent.duration.DurationInt

class WebSocketClientHandler extends SimpleChannelInboundHandler[AnyRef] with StrictLogging {

  private val queue = new ArrayBlockingQueue[String](1000)
  private final var handshaker: WebSocketClientHandshaker = null
  private var handshakeFuture: ChannelPromise = null

  def this(handshaker: WebSocketClientHandshaker) = {
    this()
    this.handshaker = handshaker
  }

  def awaitMessage(): String = {
    queue.poll(10.seconds.toMillis, TimeUnit.MILLISECONDS)
  }

  override def handlerAdded(ctx: ChannelHandlerContext): Unit = {
    handshakeFuture = ctx.newPromise
  }

  override def channelActive(ctx: ChannelHandlerContext): Unit = {
    handshaker.handshake(ctx.channel)
  }

  override def channelInactive(ctx: ChannelHandlerContext): Unit = {
    logger.trace("WebSocket Client disconnected!")
  }

  def handshakeComplete: Boolean = handshakeFuture != null && handshakeFuture.isDone && handshakeFuture.isSuccess

  override def channelRead0(ctx: ChannelHandlerContext, msg: scala.AnyRef): Unit = {
    val ch: Channel = ctx.channel
    if (!handshaker.isHandshakeComplete) {
      handshaker.finishHandshake(ch, msg.asInstanceOf[FullHttpResponse])
      logger.trace("WebSocket Client connected!")
      handshakeFuture.setSuccess()
      return
    }
    if (msg.isInstanceOf[FullHttpResponse]) {
      val response: FullHttpResponse = msg.asInstanceOf[FullHttpResponse]
      throw new IllegalStateException("Unexpected FullHttpResponse (getStatus=" + response.status + ", content=" + response.content.toString(CharsetUtil.UTF_8) + ')')
    }
    val frame: WebSocketFrame = msg.asInstanceOf[WebSocketFrame]
    if (frame.isInstanceOf[TextWebSocketFrame]) {
      val textFrame: TextWebSocketFrame = frame.asInstanceOf[TextWebSocketFrame]
      logger.trace("[WS CLIENT] on msg " + textFrame.text())
      queue.add(textFrame.text())
    }
    else if (frame.isInstanceOf[PongWebSocketFrame]) {
      logger.trace("WebSocket Client received pong")
    }
    else if (frame.isInstanceOf[CloseWebSocketFrame]) {
      logger.trace("WebSocket Client received closing")
      ch.close
    }
  }

  override def exceptionCaught(ctx: ChannelHandlerContext, cause: Throwable): Unit = {
    if (!handshakeFuture.isDone) {
      handshakeFuture.setFailure(cause)
    }
    ctx.close
  }



}
