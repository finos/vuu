package org.finos.vuu.net.ws


import com.typesafe.scalalogging.StrictLogging
import io.netty.buffer.Unpooled
import io.netty.channel.{ChannelHandlerContext, SimpleChannelInboundHandler}
import io.netty.handler.codec.http.HttpHeaderNames._
import io.netty.handler.codec.http.HttpMethod._
import io.netty.handler.codec.http.HttpResponseStatus._
import io.netty.handler.codec.http.HttpVersion._
import io.netty.handler.codec.http.websocketx._
import io.netty.handler.codec.http.{DefaultFullHttpResponse, FullHttpRequest, FullHttpResponse}
import io.netty.util.CharsetUtil
import org.finos.vuu.net.ViewServerHandler

/**
 * Handles handshakes and messages
 */
class WebSocketServerHandler(handler: ViewServerHandler) extends SimpleChannelInboundHandler[Object] with StrictLogging {

  private final val WEBSOCKET_PATH = "/websocket";
  private var handshaker: WebSocketServerHandshaker = _


  override def channelRead0(ctx: ChannelHandlerContext, msg: Object): Unit = {
    if (msg.isInstanceOf[FullHttpRequest]) {
      handleHttpRequest(ctx, msg.asInstanceOf[FullHttpRequest]);
    } else if (msg.isInstanceOf[WebSocketFrame]) {
      handleWebSocketFrame(ctx, msg.asInstanceOf[WebSocketFrame]);
    }
  }

  @Override
  override def channelReadComplete(ctx: ChannelHandlerContext) = {
    ctx.flush();
  }

  private def handleHttpRequest(ctx: ChannelHandlerContext, req: FullHttpRequest) {
    // Handle a bad request.
    if (!req.decoderResult().isSuccess()) {
      sendHttpResponse(ctx, req, new DefaultFullHttpResponse(HTTP_1_1, BAD_REQUEST));
    }

    // Allow only GET methods.
    if (req.method() != GET) {
      sendHttpResponse(ctx, req, new DefaultFullHttpResponse(HTTP_1_1, FORBIDDEN));
      return;
    }

    // Send the demo page and favicon.ico
    if ("/".equals(req.uri())) {
      val content = WebSocketServerIndexPage.getContent(getWebSocketLocation(req));
      val res = new DefaultFullHttpResponse(HTTP_1_1, OK, content);

      res.headers().set(CONTENT_TYPE, "text/html; charset=UTF-8");
      res.headers().set(CONTENT_LENGTH, content.readableBytes().toString);


      sendHttpResponse(ctx, req, res);
      return;
    }

    if ("/favicon.ico".equals(req.uri())) {
      val res = new DefaultFullHttpResponse(HTTP_1_1, NOT_FOUND);
      sendHttpResponse(ctx, req, res);
      return;
    }

    // Handshake
    val wsFactory = new WebSocketServerHandshakerFactory(
      getWebSocketLocation(req), null, true, WebSocketConstants.MAX_FRAME_SIZE);
    handshaker = wsFactory.newHandshaker(req);
    if (handshaker == null) {
      WebSocketServerHandshakerFactory.sendUnsupportedVersionResponse(ctx.channel());
    } else {
      handshaker.handshake(ctx.channel(), req);
    }
  }

  def handleWebSocketFrame(ctx: ChannelHandlerContext, frame: WebSocketFrame): Unit = {

    // Check for closing frame
    if (frame.isInstanceOf[CloseWebSocketFrame]) {
      logger.info("Got web socket close frame")
      handshaker.close(ctx.channel(), frame.retain().asInstanceOf[CloseWebSocketFrame]);
      return;
    }
    if (frame.isInstanceOf[PingWebSocketFrame]) {
      ctx.channel().write(new PongWebSocketFrame(frame.content().retain()));
      return;
    }
    if (!(frame.isInstanceOf[TextWebSocketFrame])) {
      throw new UnsupportedOperationException(String.format("%s frame types not supported", frame.getClass()
        .getName()));
    }

    val request = (frame.asInstanceOf[TextWebSocketFrame]).text();
    logger.debug("[WS SERVER] on msg " + request)
    handler.handle(request, ctx.channel())
    //System.err.printf("%s received %s%n", ctx.channel(), request);
    //ctx.channel().write(new TextWebSocketFrame(request.toUpperCase()));

  }

  def sendHttpResponse(ctx: ChannelHandlerContext, req: FullHttpRequest, res: FullHttpResponse) {
    // Generate an error page if response getStatus code is not OK (200).
    if (res.status().code() != 200) {
      val buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
      res.content().writeBytes(buf);
      buf.release();


      res.headers().set(CONTENT_LENGTH, res.content().readableBytes().toString);
      //HttpUtil.c(res, res.content().readableBytes());
    }

    // Send the response and close the connection if necessary.
    val f = ctx.channel().writeAndFlush(res);
  }

  override def exceptionCaught(ctx: ChannelHandlerContext, cause: Throwable) {
    logger.info("Exception: Closing context")
    cause.printStackTrace();
    ctx.close();
  }

  def getWebSocketLocation(req: FullHttpRequest): String = {
    val location = req.headers().get(HOST) + WEBSOCKET_PATH;
    return "ws://" + location;
  }

}
