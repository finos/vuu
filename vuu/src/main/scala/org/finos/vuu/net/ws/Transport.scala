package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import io.netty.channel.epoll.{Epoll, EpollEventLoopGroup, EpollServerSocketChannel, EpollSocketChannel}
import io.netty.channel.kqueue.{KQueue, KQueueEventLoopGroup, KQueueServerSocketChannel, KQueueSocketChannel}
import io.netty.channel.nio.NioEventLoopGroup
import io.netty.channel.socket.nio.{NioServerSocketChannel, NioSocketChannel}
import io.netty.channel.{Channel, EventLoopGroup, ServerChannel}

trait Transport {

  def eventLoopGroup(threads: Int = 0): EventLoopGroup

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

  override def eventLoopGroup(threads: Int = 0): EventLoopGroup = new EpollEventLoopGroup(threads)

  override def channelClass: Class[_ <: Channel] = classOf[EpollSocketChannel]

  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[EpollServerSocketChannel]

}

object KQueueNativeTransport extends Transport {

  override def eventLoopGroup(threads: Int = 0): EventLoopGroup = new KQueueEventLoopGroup(threads)

  override def channelClass: Class[_ <: Channel] = classOf[KQueueSocketChannel]

  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[KQueueServerSocketChannel]

}

object NioTransport extends Transport {

  override def eventLoopGroup(threads: Int = 0): EventLoopGroup = new NioEventLoopGroup(threads)

  override def channelClass: Class[_ <: Channel] = classOf[NioSocketChannel]

  override def serverChannelClass: Class[_ <: ServerChannel] = classOf[NioServerSocketChannel]

}