package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.epoll.{Epoll, EpollIoHandler, EpollServerSocketChannel, EpollSocketChannel}
import io.netty.channel.kqueue.{KQueue, KQueueIoHandler, KQueueServerSocketChannel, KQueueSocketChannel}
import io.netty.channel.nio.NioIoHandler
import io.netty.channel.socket.nio.{NioServerSocketChannel, NioSocketChannel}
import io.netty.channel.{Channel, EventLoopGroup, IoHandlerFactory, MultiThreadIoEventLoopGroup, ServerChannel}

trait Transport {

  def ioHandlerFactory: IoHandlerFactory

  def eventLoopGroup(threads: Int = 0): EventLoopGroup = {
    new MultiThreadIoEventLoopGroup(threads, ioHandlerFactory)
  }

  def channelClass: Class[_ <: Channel]

  def serverChannelClass: Class[_ <: ServerChannel]
}

object Transport extends StrictLogging {

  def apply(nativeTransport: Boolean): Transport = {
    if (nativeTransport) {
      if (Epoll.isAvailable) {
        logger.debug("Using EpollNativeTransport")
        return EpollNativeTransport
      } else if (KQueue.isAvailable) {
        logger.debug("Using KQueueNativeTransport")
        return KQueueNativeTransport
      }
    }
    logger.debug("Using NioTransport")
    NioTransport
  }
}

object EpollNativeTransport extends Transport {
  override def ioHandlerFactory: IoHandlerFactory = EpollIoHandler.newFactory()
  override def channelClass: Class[_ <: Channel] = classOf[EpollSocketChannel]
  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[EpollServerSocketChannel]
}

object KQueueNativeTransport extends Transport {
  override def ioHandlerFactory: IoHandlerFactory = KQueueIoHandler.newFactory()
  override def channelClass: Class[_ <: Channel] = classOf[KQueueSocketChannel]
  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[KQueueServerSocketChannel]
}

object NioTransport extends Transport {
  override def ioHandlerFactory: IoHandlerFactory = NioIoHandler.newFactory()
  override def channelClass: Class[_ <: Channel] = classOf[NioSocketChannel]
  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[NioServerSocketChannel]
}