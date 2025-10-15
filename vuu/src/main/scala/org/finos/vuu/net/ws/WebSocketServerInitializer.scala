package org.finos.vuu.net.ws

import io.netty.channel.ChannelInitializer
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler
import io.netty.handler.codec.http.{HttpObjectAggregator, HttpServerCodec}
import org.finos.vuu.core.VuuWebSocketOptions
import org.finos.vuu.net.ViewServerHandlerFactory;

/**
 */
class WebSocketServerInitializer(val options: VuuWebSocketOptions,
                                 val factory: ViewServerHandlerFactory) extends ChannelInitializer[SocketChannel] {

  @Override
  override def initChannel(ch: SocketChannel): Unit = {

    val pipeline = ch.pipeline()

    val sslContext = new WebServerSSLContextFactory().buildContext(options.sslOptions)
    if (sslContext.nonEmpty) {
      pipeline.addLast("ssl", sslContext.get.newHandler(ch.alloc()))
    }

    pipeline.addLast("http-codec", new HttpServerCodec())
    
    pipeline.addLast("aggregator", new HttpObjectAggregator(WebSocketConstants.MAX_CONTENT_LENGTH))
    
    if (options.compressionEnabled) {
      pipeline.addLast("compression", new WebSocketServerCompressionHandler(WebSocketConstants.MAX_CONTENT_LENGTH))
    }
    
    pipeline.addLast("protocol", new WebSocketServerProtocolHandler(s"/${options.uri}", null,
      options.compressionEnabled, WebSocketConstants.MAX_CONTENT_LENGTH))
    
    //each tcp session will have a local view server handler,
    //this allows us to call (handler.close() when disconnected
    pipeline.addLast("handler", new WebSocketServerHandler(factory.create()))
  }
}
