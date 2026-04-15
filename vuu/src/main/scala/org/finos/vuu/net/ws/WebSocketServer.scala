package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.ServerBootstrap
import io.netty.channel.{Channel, EventLoopGroup}
import io.netty.handler.logging.{LogLevel, LoggingHandler}
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.core.VuuWebSocketOptions
import org.finos.vuu.net.ViewServerHandlerFactory

class WebSocketServer(options: VuuWebSocketOptions, factory: ViewServerHandlerFactory)
                     (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  lifecycle(this)

  private val transport = Transport(options.nativeTransportEnabled)
  @volatile private var parentGroup: Option[EventLoopGroup] = None
  @volatile private var childGroup: Option[EventLoopGroup] = None
  @volatile private var channel: Option[Channel] = None

  def isOpen: Boolean = channel.exists(_.isOpen)

  override def doStart(): Unit = synchronized {
    try {
      logger.debug(s"Starting websocket server on ${options.bindAddress}:${options.wsPort}...")

      val pGroup = transport.eventLoopGroup(1)
      val cGroup = transport.eventLoopGroup()
      parentGroup = Some(pGroup)
      childGroup = Some(cGroup)

      val bootstrap = new ServerBootstrap()
        .group(pGroup, cGroup)
        .channel(transport.serverChannelClass)
        .handler(new LoggingHandler(LogLevel.DEBUG))
        .childHandler(new WebSocketServerInitializer(options, factory))

      val ch = bootstrap.bind(options.bindAddress, options.wsPort).sync().channel()
      channel = Some(ch)

      logger.info(s"Websocket server bound to ${options.bindAddress}:${options.wsPort}")
    } catch {
      case e: Exception =>
        logger.error("Failed to start WebSocket server", e)
        cleanUp()
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    logger.debug("Stopping websocket server")
    cleanUp()
    logger.info("Websocket server stopped")
  }

  override def doInitialize(): Unit = {    
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "websocketServer"

  private def cleanUp(): Unit = {
    channel.foreach { ch =>
      try {
        ch.close().sync()
      } catch {
        case e: Exception => logger.warn("Error closing channel", e)
      }
      channel = None
    }

    List(childGroup -> "childGroup", parentGroup -> "parentGroup").foreach {
      case (Some(group), name) =>
        try {
          group.shutdownGracefully().sync()
          logger.debug(s"Shutdown $name successfully")
        } catch {
          case e: Exception => logger.warn(s"Error shutting down $name", e)
        }
      case _ => //Nothing to do
    }

    childGroup = None
    parentGroup = None
  }

}

