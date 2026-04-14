package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.{Bootstrap, ServerBootstrap}
import io.netty.channel.*
import io.netty.channel.socket.SocketChannel
import io.netty.handler.codec.http.websocketx.*
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler
import io.netty.handler.codec.http.{DefaultHttpHeaders, HttpClientCodec, HttpObjectAggregator}
import io.netty.handler.logging.{LogLevel, LoggingHandler}
import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.client.VuuClientOptions
import org.finos.vuu.core.{VuuSSLDisabled, VuuSSLOptions, VuuWebSocketOptions}

import java.net.URI

class WebSocketClient(val options: VuuClientOptions,
                      val handler: WebSocketClientHandler)
                     (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val transport: Transport = Transport(options.nativeTransportEnabled)
  @volatile private var eventLoopGroup: Option[EventLoopGroup] = None   
  @volatile private var channel: Option[Channel] = None

  lifecycle(this)

  override def doStart(): Unit = synchronized {
    logger.debug(s"WebSocket client connecting to ${options.host}:${options.port}...")
    try {
      val eGroup = transport.eventLoopGroup(1)
      eventLoopGroup = Some(eGroup)

      val bootstrap = new Bootstrap()
        .group(eGroup)
        .channel(transport.channelClass)
        .handler(new WebSocketClientInitializer(options, handler))

      val ch = bootstrap.connect(options.host, options.port).sync().channel()
      channel = Some(ch)
      logger.info(s"WebSocket client connected to ${options.bindAddress}:${options.wsPort}")
    } catch {
      case e: Exception =>
        logger.error("Failed to start WebSocket client", e)
        cleanUp()
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    if (channel != null) {
      channel.close()
      channel = null
    }
    if (eventLoopGroup != null) {
      eventLoopGroup.shutdownGracefully().sync()
      eventLoopGroup = null
    }
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "webSocketClient"

  private def cleanUp(): Unit = {
    
  }
  
}
