package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.Bootstrap
import io.netty.channel.*
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.client.VuuClientOptions

class WebSocketClient(val options: VuuClientOptions)
                     (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val transport: Transport = Transport(options.nativeTransportEnabled)
  @volatile private var eventLoopGroup: Option[EventLoopGroup] = None
  @volatile private var channel: Option[Channel] = None

  lifecycle(this)

  def getClientSession: Option[WebSocketClientSession] = {
    channel.flatMap { ch =>
      Option(ch.attr(WebSocketClientHandler.sessionKey).get())
    }
  }

  override def doStart(): Unit = synchronized {
    logger.debug(s"Websocket client connecting to ${options.host}:${options.port}...")
    try {
      val eGroup = transport.eventLoopGroup(1)
      eventLoopGroup = Some(eGroup)

      val bootstrap = new Bootstrap()
        .group(eGroup)
        .channel(transport.channelClass)
        .handler(new WebSocketClientInitializer(options))

      val ch = bootstrap.connect(options.host, options.port).sync().channel()
      channel = Some(ch)

      logger.info(s"Websocket client connected to ${options.host}:${options.port}")
    } catch {
      case e: Exception =>
        logger.error("Failed to start WebSocket client", e)
        cleanUp()
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    logger.debug("Stopping websocket client")
    cleanUp()
    logger.info("Websocket server client")
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "webSocketClient"

  private def cleanUp(): Unit = {
    channel.foreach { ch =>
      try {
        ch.close().sync()
      } catch {
        case e: Exception => logger.warn("Error closing channel", e)
      }
      channel = None
    }
    eventLoopGroup.foreach { group =>
      try {
        group.shutdownGracefully().sync()
      } catch {
        case e: Exception => logger.warn("Error closing eventLoopGroup", e)
      }
      eventLoopGroup = None
    }
  }
  
}
