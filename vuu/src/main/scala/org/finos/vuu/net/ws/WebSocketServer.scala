package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.ServerBootstrap
import io.netty.channel.Channel
import io.netty.handler.logging.{LogLevel, LoggingHandler}
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.core.VuuWebSocketOptions
import org.finos.vuu.net.ViewServerHandlerFactory

/**
 * A HTTP server which serves Web Socket requests at:
 *
 * http://localhost:8080/websocket
 *
 * Open your browser at http://localhost:8080/, then the demo page will be loaded and a Web Socket connection will be
 * made automatically.
 *
 * This server illustrates support for the different web socket specification versions and will work with:
 *
 * <ul>
 * <li>Safari 5+ (draft-ietf-hybi-thewebsocketprotocol-00)
 * <li>Chrome 6-13 (draft-ietf-hybi-thewebsocketprotocol-00)
 * <li>Chrome 14+ (draft-ietf-hybi-thewebsocketprotocol-10)
 * <li>Chrome 16+ (RFC 6455 aka draft-ietf-hybi-thewebsocketprotocol-17)
 * <li>Firefox 7+ (draft-ietf-hybi-thewebsocketprotocol-10)
 * <li>Firefox 11+ (RFC 6455 aka draft-ietf-hybi-thewebsocketprotocol-17)
 * </ul>
 */

class WebSocketServer(options: VuuWebSocketOptions, factory: ViewServerHandlerFactory)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  lifecycle(this)

  private val transport = Transport(options.nativeTransportEnabled)
  private val bossGroup = transport.eventLoopGroup(1);
  private val workerGroup = transport.eventLoopGroup()
  private val bootstrap = new ServerBootstrap()
  var channel: Channel = _

  def isOpen: Boolean = channel != null && channel.isOpen

  override def doStart(): Unit = {
    logger.debug("Starting websocket server")
    channel = bootstrap.bind(options.bindAddress, options.wsPort).sync().channel();
    while (!isOpen) {}
    logger.info("Started websocket server")
  }

  override def doStop(): Unit = {
    logger.debug("Stopping websocket server")
    if (channel != null && channel.isOpen) {
      channel.close()
    }
    logger.info("Stopped websocket server")
  }

  override def doInitialize(): Unit = {
    logger.debug(s"Initialising with channel class ${transport.serverChannelClass.getName}")

    bootstrap.group(bossGroup, workerGroup)
      .channel(transport.serverChannelClass)
      .handler(new LoggingHandler(LogLevel.INFO))
      .childHandler(new WebSocketServerInitializer(options, factory))
  }

  override def doDestroy(): Unit = {
    bossGroup.shutdownGracefully()
    workerGroup.shutdownGracefully()
  }

  override val lifecycleId: String = "websocketServer"
}

