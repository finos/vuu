package io.venuu.vuu.net.ws

import io.netty.channel.ChannelInitializer
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.{HttpObjectAggregator, HttpServerCodec}
import io.venuu.vuu.net.ViewServerHandlerFactory;


/**
 */
class WebSocketServerInitializer(factory: ViewServerHandlerFactory) extends ChannelInitializer[SocketChannel] {

  ////private val SslContext sslCtx;
  //
  //public WebSocketServerInitializer {
  //this.sslCtx = sslCtx;
  //}

  @Override
  override def initChannel(ch: SocketChannel) = {
    val pipeline = ch.pipeline();
    //if (sslCtx != null) {
    //pipeline.addLast(sslCtx.newHandler(ch.alloc()));
    //}
    pipeline.addLast(new HttpServerCodec());
    pipeline.addLast(new HttpObjectAggregator(65536));
    //pipeline.addLast(new WebSocketServerCompressionHandler());
    //each tpc session will have a local view server handler,
    //this allows us to call (handler.close() when disconnected
    pipeline.addLast(new WebSocketServerHandler(factory.create()));
  }
}
