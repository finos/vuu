package org.finos.vuu.net.ws

import io.netty.channel.socket.SocketChannel
import io.netty.channel.{ChannelInitializer, ChannelPipeline}
import io.netty.handler.codec.http.websocketx.WebSocketClientProtocolHandler
import io.netty.handler.codec.http.websocketx.WebSocketVersion.V13
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import org.finos.vuu.client.VuuClientOptions

import java.net.URI

class WebSocketClientInitializer(val options: VuuClientOptions) extends ChannelInitializer[SocketChannel] {

  @Override
  protected def initChannel(ch: SocketChannel): Unit = {
    val pipeline: ChannelPipeline = ch.pipeline

    val uri = options.buildUri()

    applySSL(uri, ch, pipeline)

    pipeline.addLast("http-codec", new HttpClientCodec())

    pipeline.addLast("aggregator", new HttpObjectAggregator(WebSocketConstants.MAX_CONTENT_LENGTH))

    if (options.compressionEnabled) {
      pipeline.addLast("compression", new WebSocketClientCompressionHandler(WebSocketConstants.MAX_CONTENT_LENGTH))
    }

    pipeline.addLast("protocol", new WebSocketClientProtocolHandler(uri, V13, null, options.compressionEnabled,
      new DefaultHttpHeaders(), WebSocketConstants.MAX_CONTENT_LENGTH))

    pipeline.addLast("handler", new WebSocketClientHandler(WebSocketClientSession(ch)))

    pipeline.addLast("error-handler", new WebSocketChannelExceptionHandler())
  }

  private def applySSL(uri: URI, socketChannel: SocketChannel, channelPipeline: ChannelPipeline): Unit = {
    WebSocketSSLContextFactory.buildClientContext(options.sslOptions) match {
      case Some(sslContext) =>
        channelPipeline.addLast("ssl", sslContext.newHandler(socketChannel.alloc(), uri.getHost, uri.getPort))
      case None => //Nothing to do
    }
  }

}
