package io.venuu.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.{Channel, ChannelHandlerContext, ChannelPromise, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.FullHttpResponse
import io.netty.handler.codec.http.websocketx._
import io.netty.util.CharsetUtil

import java.util.concurrent.{ArrayBlockingQueue, TimeUnit}
import scala.concurrent.duration._

class WebSocketClientHandler() extends SimpleChannelInboundHandler[AnyRef] with StrictLogging {

  private val queue = new ArrayBlockingQueue[String](1000)

  private final var handshaker: WebSocketClientHandshaker = null
  private var handshakeFuture: ChannelPromise = null

  def this(handshaker: WebSocketClientHandshaker) {
    this()
    this.handshaker = handshaker
  }

  def awaitMessage(): String = {
    queue.poll(10.seconds.toMillis, TimeUnit.MILLISECONDS)
  }

  override def handlerAdded(ctx: ChannelHandlerContext) {
    handshakeFuture = ctx.newPromise
  }

  override def channelActive(ctx: ChannelHandlerContext) {
    handshaker.handshake(ctx.channel)
  }

  override def channelInactive(ctx: ChannelHandlerContext) {
    logger.info("WebSocket Client disconnected!")
  }


  override def channelRead0(ctx: ChannelHandlerContext, msg: scala.AnyRef): Unit = {
    val ch: Channel = ctx.channel
    if (!handshaker.isHandshakeComplete) {
      handshaker.finishHandshake(ch, msg.asInstanceOf[FullHttpResponse])
      logger.info("WebSocket Client connected!")
      handshakeFuture.setSuccess
      return
    }
    if (msg.isInstanceOf[FullHttpResponse]) {
      val response: FullHttpResponse = msg.asInstanceOf[FullHttpResponse]
      throw new IllegalStateException("Unexpected FullHttpResponse (getStatus=" + response.status + ", content=" + response.content.toString(CharsetUtil.UTF_8) + ')')
    }
    val frame: WebSocketFrame = msg.asInstanceOf[WebSocketFrame]
    if (frame.isInstanceOf[TextWebSocketFrame]) {
      val textFrame: TextWebSocketFrame = frame.asInstanceOf[TextWebSocketFrame]
      logger.debug("[WS CLIENT] on msg " + textFrame.text())
      queue.add(textFrame.text())
    }
    else if (frame.isInstanceOf[PongWebSocketFrame]) {
      System.out.println("WebSocket Client received pong")
    }
    else if (frame.isInstanceOf[CloseWebSocketFrame]) {
      System.out.println("WebSocket Client received closing")
      ch.close
    }
  }

  override def exceptionCaught(ctx: ChannelHandlerContext, cause: Throwable) {
    cause.printStackTrace
    if (!handshakeFuture.isDone) {
      handshakeFuture.setFailure(cause)
    }
    ctx.close
  }
}
