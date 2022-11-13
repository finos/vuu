package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.bootstrap.ServerBootstrap
import io.netty.channel.Channel
import io.netty.channel.nio.NioEventLoopGroup
import io.netty.channel.socket.nio.NioServerSocketChannel
import io.netty.handler.logging.{LogLevel, LoggingHandler}
import org.finos.vuu.net.ViewServerHandlerFactory
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

//import io.netty.handler.ssl.SslContext;
//import io.netty.handler.ssl.SslContextBuilder

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

class WebSocketServer(port: Int, factory: ViewServerHandlerFactory)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  lifecycle(this)

  val bossGroup = new NioEventLoopGroup(1);
  val workerGroup = new NioEventLoopGroup();
  var channel: Channel = null
  val b = new ServerBootstrap();
  var ch: Channel = null

  def isOpen() = ch.isOpen

  override def doStart(): Unit = {
    logger.info("Starting websocket server")
    ch = b.bind("localhost", port).sync().channel();
    while (!isOpen()) {}
    logger.info("Websocket server open and ready")

  }

  override def doStop(): Unit = {
    bossGroup.shutdownGracefully()
    workerGroup.shutdownGracefully()
  }

  override def doInitialize(): Unit = {

    b.group(bossGroup, workerGroup)
      .channel(classOf[NioServerSocketChannel])
      .handler(new LoggingHandler(LogLevel.INFO))
      .childHandler(new WebSocketServerInitializer(factory));

  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "websocketServer"
}

//object WebSocketServer extends App{
//
//  final val SSL = false
//  final val PORT = 8080
//
//  override def main(args: Array[String]) = {
//
////    if (SSL) {
////      SelfSignedCertificate ssc = new SelfSignedCertificate();
////      sslCtx = SslContextBuilder.forServer(ssc.certificate(), ssc.privateKey()).build();
////    } else {
////      sslCtx = null;
////    }
//
//    val bossGroup = new NioEventLoopGroup(1);
//    val workerGroup = new NioEventLoopGroup();
//    try {
//      val b = new ServerBootstrap();
//      b.group(bossGroup, workerGroup)
//        .channel(classOf[NioServerSocketChannel])
//      .handler(new LoggingHandler(LogLevel.INFO))
//      .childHandler(new WebSocketServerInitializer());
//
//    val ch = b.bind(PORT).sync().channel();
//
//    System.out.println("Open your web browser and navigate to " +
//      (if(SSL) "https" else "http") + "://127.0.0.1:" + PORT + '/');
//
//    ch.closeFuture().sync();
//    } finally {
//      bossGroup.shutdownGracefully();
//      workerGroup.shutdownGracefully();
//    }
//  }
//}
