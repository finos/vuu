package org.finos.vuu.test.impl

import com.typesafe.scalalogging.StrictLogging
import io.netty.buffer.ByteBufAllocator
import io.netty.channel.local.LocalChannel
import io.netty.channel.{Channel, ChannelConfig, ChannelFuture, ChannelId, ChannelMetadata, ChannelPipeline, ChannelProgressivePromise, ChannelPromise, DefaultChannelId, DefaultChannelPromise, EventLoop}
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame
import io.netty.util.{Attribute, AttributeKey}
import io.vertx.core.impl.CloseFuture

import java.net.SocketAddress
import java.util.concurrent.ConcurrentLinkedQueue

class TestChannel() extends Channel with StrictLogging {
  private val queue = new ConcurrentLinkedQueue[String]()

  override def id(): ChannelId = DefaultChannelId.newInstance()

  override def eventLoop(): EventLoop = ???

  override def parent(): Channel = ???

  override def config(): ChannelConfig = ???

  override def isOpen: Boolean = ???

  override def isRegistered: Boolean = ???

  override def isActive: Boolean = ???

  override def metadata(): ChannelMetadata = ???

  override def localAddress(): SocketAddress = ???

  override def remoteAddress(): SocketAddress = ???

  override def closeFuture(): ChannelFuture = {
    new DefaultChannelPromise(this)
  }

  override def isWritable: Boolean = ???

  override def bytesBeforeUnwritable(): Long = ???

  override def bytesBeforeWritable(): Long = ???

  override def unsafe(): Channel.Unsafe = ???

  override def pipeline(): ChannelPipeline = ???

  override def alloc(): ByteBufAllocator = ???

  override def read(): Channel = ???

  override def flush(): Channel = ???

  override def compareTo(o: Channel): Int = ???

  override def bind(localAddress: SocketAddress): ChannelFuture = ???

  override def connect(remoteAddress: SocketAddress): ChannelFuture = ???

  override def connect(remoteAddress: SocketAddress, localAddress: SocketAddress): ChannelFuture = ???

  override def disconnect(): ChannelFuture = ???

  override def close(): ChannelFuture = ???

  override def deregister(): ChannelFuture = ???

  override def bind(localAddress: SocketAddress, promise: ChannelPromise): ChannelFuture = ???

  override def connect(remoteAddress: SocketAddress, promise: ChannelPromise): ChannelFuture = ???

  override def connect(remoteAddress: SocketAddress, localAddress: SocketAddress, promise: ChannelPromise): ChannelFuture = ???

  override def disconnect(promise: ChannelPromise): ChannelFuture = ???

  override def close(promise: ChannelPromise): ChannelFuture = ???

  override def deregister(promise: ChannelPromise): ChannelFuture = ???

  override def write(msg: Any): ChannelFuture = {
    msg match {
      case frame: TextWebSocketFrame =>
        queue.add(frame.text())
        logger.trace(frame.text())
    }
    null
  }

  override def write(msg: Any, promise: ChannelPromise): ChannelFuture = {
    msg match {
      case frame: TextWebSocketFrame =>
        queue.add(frame.text())
        logger.trace(frame.text())
    }
    null
  }

  override def writeAndFlush(msg: Any, promise: ChannelPromise): ChannelFuture = {
    msg match {
      case frame: TextWebSocketFrame =>
        queue.add(frame.text())
        logger.trace(frame.text())
    }
    null
  }

  override def writeAndFlush(msg: Any): ChannelFuture = {
    msg match {
      case frame:TextWebSocketFrame =>
        queue.add(frame.text())
        logger.trace(frame.text())
    }
    null
  }

  def popMsg: Option[String] = {
    Option(queue.poll())
  }

  override def newPromise(): ChannelPromise = ???

  override def newProgressivePromise(): ChannelProgressivePromise = ???

  override def newSucceededFuture(): ChannelFuture = ???

  override def newFailedFuture(cause: Throwable): ChannelFuture = ???

  override def voidPromise(): ChannelPromise = ???

  override def attr[T](attributeKey: AttributeKey[T]): Attribute[T] = ???

  override def hasAttr[T](attributeKey: AttributeKey[T]): Boolean = ???
}
