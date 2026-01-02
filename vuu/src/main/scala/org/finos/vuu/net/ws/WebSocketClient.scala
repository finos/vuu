package org.finos.vuu.net.ws

import io.netty.bootstrap.Bootstrap
import io.netty.channel.*
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.websocketx.*
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

import java.net.URI

class WebSocketClient(url: String, port: Int, nativeTransport: Boolean = true)(using lifecycle: LifecycleContainer) extends LifecycleEnabled {

  private val transport: Transport = Transport(nativeTransport)
  private val eventLoopGroup: EventLoopGroup = transport.eventLoopGroup(1)
  private val bootstrap = new Bootstrap()
  private val uri: URI = new URI(url)
  private val handler: WebSocketClientHandler = new WebSocketClientHandler(
    WebSocketClientHandshakerFactory.newHandshaker(uri, WebSocketVersion.V13, null, true, new DefaultHttpHeaders,
      WebSocketConstants.MAX_CONTENT_LENGTH)
  )
  var channel: Channel = _

  lifecycle(this)

  def canWrite: Boolean = channel != null && channel.isOpen && channel.isWritable && handler.handshakeComplete

  def write(text: String): ChannelFuture = {
    if (canWrite)
      channel.writeAndFlush(new TextWebSocketFrame(text))
    else
      throw new RuntimeException(s"Can't write $text to channel $channel")
  }

  def awaitMessage(): String = handler.awaitMessage()

  override def doStart(): Unit = {
    channel = bootstrap.connect(uri.getHost, port).sync.channel
  }

  override def doStop(): Unit = {
    if (channel != null && channel.isOpen) {
      channel.close()
    }
  }

  override def doInitialize(): Unit = {
    bootstrap.group(eventLoopGroup)
      .channel(transport.channelClass)
      .handler(new ChannelInitializer[SocketChannel] {

        @Override
        protected def initChannel(ch: SocketChannel): Unit = {
          val pipeline: ChannelPipeline = ch.pipeline
          applySSL(ch, pipeline)
          pipeline.addLast("http-codec", new HttpClientCodec())
          pipeline.addLast("aggregator", new HttpObjectAggregator(WebSocketConstants.MAX_CONTENT_LENGTH))
          pipeline.addLast("compression", new WebSocketClientCompressionHandler(WebSocketConstants.MAX_CONTENT_LENGTH))
          pipeline.addLast("handler", handler)
        }

        private def applySSL(socketChannel: SocketChannel, channelPipeline: ChannelPipeline): Unit = {
          if (uri.getScheme == "wss") {
            val sslContext = SslContextBuilder.forClient.trustManager(InsecureTrustManagerFactory.INSTANCE).build()
            channelPipeline.addLast("ssl", sslContext.newHandler(socketChannel.alloc(), uri.getHost, port))
          }
        }

      })
  }

  override def doDestroy(): Unit = {
    eventLoopGroup.shutdownGracefully()
  }

  override val lifecycleId: String = "webSocketClient"

}
