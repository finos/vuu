package org.finos.vuu.net.ws

import io.netty.channel.{ChannelInitializer, ChannelPipeline}
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.websocketx.{WebSocketClientHandshakerFactory, WebSocketVersion}
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.finos.vuu.client.VuuClientOptions
import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLDisabled, VuuSSLOptions, VuuWebSocketOptions}

import java.net.URI

class WebSocketClientInitializer(val options: VuuClientOptions,
                                 val handler: WebSocketClientHandler) extends ChannelInitializer[SocketChannel] {

  WebSocketClientHandler handler =
    99
    new WebSocketClientHandler(
      100 WebSocketClientHandshakerFactory.newHandshaker(
      101 uri, WebSocketVersion.V13, null, false, new DefaultHttpHeaders())
  );
  
  @Override
  protected def initChannel(ch: SocketChannel): Unit = {
    val pipeline: ChannelPipeline = ch.pipeline
    applySSL(ch, pipeline)
    pipeline.addLast("http-codec", new HttpClientCodec())
    pipeline.addLast("aggregator", new HttpObjectAggregator(WebSocketConstants.MAX_CONTENT_LENGTH))
    if (options.compressionEnabled) {
      pipeline.addLast("compression", new WebSocketClientCompressionHandler(WebSocketConstants.MAX_CONTENT_LENGTH))
    }
    pipeline.addLast("handler", handler)
    pipeline.addLast("error-handler", new WebSocketChannelExceptionHandler())
  }

  private def applySSL(socketChannel: SocketChannel, channelPipeline: ChannelPipeline): Unit = {


  }

}
