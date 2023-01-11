package org.finos.vuu.net.ws

import io.netty.channel.ChannelInitializer
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.{HttpObjectAggregator, HttpServerCodec}
import io.netty.handler.ssl.SslContext
import org.finos.vuu.net.ViewServerHandlerFactory;


/**
 */
class WebSocketServerInitializer(val factory: ViewServerHandlerFactory, val sslCtx: SslContext) extends ChannelInitializer[SocketChannel] {

  @Override
  override def initChannel(ch: SocketChannel) = {

    val pipeline = ch.pipeline();

    if (sslCtx != null) {
      pipeline.addLast(sslCtx.newHandler(ch.alloc()));
    }

    pipeline.addLast(new HttpServerCodec());
    pipeline.addLast(new HttpObjectAggregator(65536));
    //pipeline.addLast(new WebSocketServerCompressionHandler());
    //each tpc session will have a local view server handler,
    //this allows us to call (handler.close() when disconnected
    pipeline.addLast(new WebSocketServerHandler(factory.create()));
  }
}
