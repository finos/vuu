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

  def canWrite(): Boolean = ch.isOpen && ch.isWritable

  def write(text: String) = {
    ch.writeAndFlush(new TextWebSocketFrame(text))
  }

  def awaitMessage() = handler.awaitMessage()

  override def doStart(): Unit = {

    val sslCtx = SslContextBuilder.forClient.trustManager(InsecureTrustManagerFactory.INSTANCE).build()

    handler = new WebSocketClientHandler(WebSocketClientHandshakerFactory.newHandshaker(uri, WebSocketVersion.V13, null, false, new DefaultHttpHeaders, WebSocketConstants.MAX_FRAME_SIZE))
    val b: Bootstrap = new Bootstrap
    b.group(group).channel(classOf[NioSocketChannel]).handler(new ChannelInitializer[SocketChannel] {

      protected def initChannel(ch: SocketChannel) {
        val p: ChannelPipeline = ch.pipeline
        //        if (sslCtx != null) {
        //          p.addLast(sslCtx.newHandler(ch.alloc, host, port))
        //        }
       // p.addLast("ssl-handler", sslCtx.newHandler(ch.alloc, "localhost", 8443))
        p.addLast(new HttpClientCodec, new HttpObjectAggregator(8192), WebSocketClientCompressionHandler.INSTANCE, handler)
      }
    })

    //Thread.sleep(2000)

    ch = b.connect(uri.getHost, port).sync.channel
  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "webSocketClient"
}

object WebSocketClient {
  val URL: String = System.getProperty("url", "wss://127.0.0.1:8080/websocket")

  @throws(classOf[Exception])
  def main(args: Array[String]) {
    val uri: URI = new URI(URL)
    val scheme: String = if (uri.getScheme == null) "ws" else uri.getScheme
    val host: String = if (uri.getHost == null) "127.0.0.1" else uri.getHost
    var port: Int = 0
    if (uri.getPort == -1) {
      if ("ws".equalsIgnoreCase(scheme)) {
        port = 80
      }
      else if ("wss".equalsIgnoreCase(scheme)) {
        port = 443
      }
      else {
        port = -1
      }
    }
    else {
      port = uri.getPort
    }
    if (!"ws".equalsIgnoreCase(scheme) && !"wss".equalsIgnoreCase(scheme)) {
      System.err.println("Only WS(S) is supported.")
      return
    }
    val ssl: Boolean = "wss".equalsIgnoreCase(scheme)
    //    val sslCtx: SslContext = null
    //    if (ssl) {
    //      sslCtx = SslContextBuilder.forClient.trustManager(InsecureTrustManagerFactory.INSTANCE).build
    //    }
    //    else {
    //      sslCtx = null
    //    }
    val group: EventLoopGroup = new NioEventLoopGroup
    try {
      val handler: WebSocketClientHandler = new WebSocketClientHandler(WebSocketClientHandshakerFactory.newHandshaker(uri, WebSocketVersion.V13, null, false, new DefaultHttpHeaders))
      val b: Bootstrap = new Bootstrap
      b.group(group).channel(classOf[NioSocketChannel]).handler(new ChannelInitializer[SocketChannel] {

        protected def initChannel(ch: SocketChannel) {
          val p: ChannelPipeline = ch.pipeline
          //        if (sslCtx != null) {
          //          p.addLast(sslCtx.newHandler(ch.alloc, host, port))
          //        }
          p.addLast(new HttpClientCodec, new HttpObjectAggregator(8192), WebSocketClientCompressionHandler.INSTANCE, handler)
        }
      })
      val ch: Channel = b.connect(uri.getHost, port).sync.channel

      val console: BufferedReader = new BufferedReader(new InputStreamReader(System.in))
      while (true) {
        val msg: String = console.readLine
        if (msg == null) {
          //break //todo: break is not supported
        }
        else if ("bye" == msg.toLowerCase) {
          ch.writeAndFlush(new CloseWebSocketFrame)
          ch.closeFuture.sync
          //break //todo: break is not supported
        }
        else if ("ping" == msg.toLowerCase) {
          val frame: WebSocketFrame = new PingWebSocketFrame(Unpooled.wrappedBuffer(Array[Byte](8, 1, 8, 1)))
          ch.writeAndFlush(frame)
        }
        else {
          val frame: WebSocketFrame = new TextWebSocketFrame(msg)
          ch.writeAndFlush(frame)
        }
      }
    } finally {
      group.shutdownGracefully
    }
  }
}
