package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.ServerBootstrap
import io.netty.channel.Channel
import io.netty.handler.logging.{LogLevel, LoggingHandler}
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.core.VuuWebSocketOptions
import org.finos.vuu.net.ViewServerHandlerFactory

class WebSocketServer(options: VuuWebSocketOptions, factory: ViewServerHandlerFactory)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  lifecycle(this)

  private val transport = Transport(options.nativeTransportEnabled)
  private val bossGroup = transport.eventLoopGroup(1);
  private val workerGroup = transport.eventLoopGroup()
  private val bootstrap = new ServerBootstrap()
  var channel: Channel = _

  def isOpen: Boolean = channel.isOpen

  override def doStart(): Unit = {
    logger.debug("Starting websocket server")
    channel = bootstrap.bind(options.bindAddress, options.wsPort).sync().channel();
    while (!isOpen) {}
    logger.info("Websocket server open and ready")
  }

  override def doStop(): Unit = {
    bossGroup.shutdownGracefully()
    workerGroup.shutdownGracefully()
  }

  override def doInitialize(): Unit = {    
    bootstrap.group(bossGroup, workerGroup)
      .channel(transport.serverChannelClass)
      .handler(new LoggingHandler(LogLevel.INFO))
      .childHandler(new WebSocketServerInitializer(options, factory))
  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "websocketServer"
}

