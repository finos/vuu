package org.finos.vuu.net.ws

import io.netty.bootstrap.Bootstrap
import io.netty.buffer.Unpooled
import io.netty.channel._
import io.netty.channel.nio.NioEventLoopGroup
import io.netty.channel.socket.SocketChannel
import io.netty.channel.socket.nio.NioSocketChannel
import io.netty.handler.codec.http.websocketx._
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

//import io.netty.handler.ssl.SslContext
//import io.netty.handler.ssl.SslContextBuilder
//import io.netty.handler.ssl.util.InsecureTrustManagerFactory
//import io.netty.handler.ssl.util.SelfSignedCertificate
import java.io.{BufferedReader, InputStreamReader}
import java.net.URI

class WebSocketClient(url: String, port: Int)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled {

  lifecycle(this)

  val uri: URI = new URI(url)

  var ch: Channel = null

  var handler: WebSocketClientHandler = _

  val group: EventLoopGroup = new NioEventLoopGroup

  def canWrite: Boolean = ch.isOpen && ch.isWritable && handler.handshakeComplete

  def write(text: String) = {
    ch.writeAndFlush(new TextWebSocketFrame(text))
  }

  def awaitMessage() = handler.awaitMessage()

  @Override
  override def doStart(): Unit = {

    handler = new WebSocketClientHandler(WebSocketClientHandshakerFactory.newHandshaker(uri, WebSocketVersion.V13, null, false, new DefaultHttpHeaders, WebSocketConstants.MAX_FRAME_SIZE))
    val b: Bootstrap = new Bootstrap
    b.group(group).channel(classOf[NioSocketChannel]).handler(new ChannelInitializer[SocketChannel] {

      @Override
      protected def initChannel(ch: SocketChannel): Unit = {
        val p: ChannelPipeline = ch.pipeline
        applySSL(ch, p)
        p.addLast(new HttpClientCodec, new HttpObjectAggregator(8192), WebSocketClientCompressionHandler.INSTANCE, handler)
      }

      private def applySSL(socketChannel: SocketChannel, channelPipeline: ChannelPipeline): Unit = {
        if (uri.getScheme == "wss") {
          val sslContext = SslContextBuilder.forClient.trustManager(InsecureTrustManagerFactory.INSTANCE).build()
          channelPipeline.addLast(sslContext.newHandler(socketChannel.alloc(), uri.getHost, port))
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
