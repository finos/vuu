package org.finos.vuu.net.ws

import io.netty.bootstrap.Bootstrap
import io.netty.channel.*
import io.netty.channel.nio.NioEventLoopGroup
import io.netty.channel.socket.SocketChannel
import io.netty.channel.socket.nio.NioSocketChannel
import io.netty.handler.codec.http.websocketx.*
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

//import io.netty.handler.ssl.SslContext
//import io.netty.handler.ssl.SslContextBuilder
//import io.netty.handler.ssl.util.InsecureTrustManagerFactory
//import io.netty.handler.ssl.util.SelfSignedCertificate
import java.net.URI

class WebSocketClient(url: String, port: Int)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled {

  lifecycle(this)

  val uri: URI = new URI(url)

  var ch: Channel = null

  var handler: WebSocketClientHandler = _

  val group: EventLoopGroup = new NioEventLoopGroup

  def canWrite: Boolean = ch.isOpen && ch.isWritable && handler.handshakeComplete

  def write(text: String): ChannelFuture = {
    ch.writeAndFlush(new TextWebSocketFrame(text))
  }

  def awaitMessage(): String = handler.awaitMessage()

  @Override
  override def doStart(): Unit = {

    handler = new WebSocketClientHandler(
      WebSocketClientHandshakerFactory.newHandshaker(uri, WebSocketVersion.V13, null, true, new DefaultHttpHeaders,
        WebSocketConstants.MAX_CONTENT_LENGTH)
    )
    val b: Bootstrap = new Bootstrap
    b.group(group).channel(classOf[NioSocketChannel]).handler(new ChannelInitializer[SocketChannel] {

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

    ch = b.connect(uri.getHost, port).sync.channel
  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "webSocketClient"
}
