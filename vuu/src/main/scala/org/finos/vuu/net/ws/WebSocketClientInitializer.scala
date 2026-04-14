package org.finos.vuu.net.ws

import io.netty.channel.socket.SocketChannel
import io.netty.channel.{ChannelInitializer, ChannelPipeline}
import io.netty.handler.codec.http.websocketx.WebSocketClientProtocolHandler
import io.netty.handler.codec.http.websocketx.WebSocketVersion.V13
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.ssl.{SslContext, SslContextBuilder}
import org.finos.vuu.client.{VuuClientOptions, VuuClientSSLByDefaultTruststore, VuuClientSSLByTrustStore, VuuClientSSLDisabled}

import java.io.FileInputStream
import java.net.URI
import java.security.KeyStore
import javax.net.ssl.TrustManagerFactory

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
    options.sslOptions match {
      case VuuClientSSLDisabled => //Nothing to do
      case VuuClientSSLByDefaultTruststore =>
        val sslCtx: SslContext = SslContextBuilder.forClient().build()
        channelPipeline.addLast("ssl", sslCtx.newHandler(socketChannel.alloc(), uri.getHost, uri.getPort))
      case VuuClientSSLByTrustStore(trustStorePath, trustStorePassword) =>
        val ks = KeyStore.getInstance("JKS")
        val fis = new FileInputStream(trustStorePath)
        try ks.load(fis, trustStorePassword.toCharArray)
        finally fis.close()
        val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm)
        tmf.init(ks)
        val sslCtx: SslContext = SslContextBuilder.forClient()
          .trustManager(tmf)
          .build()
        channelPipeline.addLast("ssl", sslCtx.newHandler(socketChannel.alloc(), uri.getHost, uri.getPort))
    }

  }

}
