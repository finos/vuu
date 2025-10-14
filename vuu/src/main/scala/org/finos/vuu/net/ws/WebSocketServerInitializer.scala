package org.finos.vuu.net.ws

import io.netty.channel.ChannelInitializer
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler
import io.netty.handler.codec.http.{HttpObjectAggregator, HttpServerCodec}
import io.netty.handler.ssl.SslContext
import org.finos.vuu.net.ViewServerHandlerFactory;

/**
 */
class WebSocketServerInitializer(val websocketPath: String,
                                 val factory: ViewServerHandlerFactory,
                                 val sslCtx: Option[SslContext]) extends ChannelInitializer[SocketChannel] {

  @Override
  override def initChannel(ch: SocketChannel): Unit = {

    val pipeline = ch.pipeline()

    if (sslCtx.nonEmpty) {
      pipeline.addLast("ssl", sslCtx.get.newHandler(ch.alloc()))
    }

    pipeline.addLast("http-codec", new HttpServerCodec())
    pipeline.addLast("aggregator", new HttpObjectAggregator(WebSocketConstants.MAX_CONTENT_LENGTH))
    pipeline.addLast("compression", new WebSocketServerCompressionHandler(WebSocketConstants.COMPRESSION_MAX_ALLOCATION))
    pipeline.addLast("protocol", new WebSocketServerProtocolHandler(s"/$websocketPath", null, true, WebSocketConstants.MAX_FRAME_SIZE))
    //each tcp session will have a local view server handler,
    //this allows us to call (handler.close() when disconnected
    pipeline.addLast("handler", new WebSocketServerHandler(factory.create()))
  }
}
