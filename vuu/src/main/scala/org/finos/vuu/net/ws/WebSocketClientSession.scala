package org.finos.vuu.net.ws

import io.netty.channel.Channel
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame

import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.{ArrayBlockingQueue, TimeUnit}

trait WebSocketClientSession {

  def isConnected: Boolean

  def sendMessage(message: String): Boolean

  def awaitMessage(): Option[String]

  private[ws] def markHandshakeComplete(): Unit

  private[ws] def queueMessage(message: String): Unit
}

object WebSocketClientSession {

  def apply(channel: Channel): WebSocketClientSession = WebSocketClientSessionImpl(channel)

}

private case class WebSocketClientSessionImpl(channel: Channel) extends WebSocketClientSession {

  private val handshakeComplete = AtomicBoolean(false)
  private val queue = new ArrayBlockingQueue[String](1_000)

  override def isConnected: Boolean = channel.isActive && channel.isWritable && handshakeComplete.get()

  override def sendMessage(message: String): Boolean = {
    if (isConnected) {
      channel.writeAndFlush(new TextWebSocketFrame(message))
      true
    } else {
      false
    }
  }

  override def awaitMessage(): Option[String] = {
    Option(queue.poll(10, TimeUnit.SECONDS))
  }

  override def markHandshakeComplete(): Unit = {
    this.handshakeComplete.set(true)
  }

  override def queueMessage(message: String): Unit = {
    queue.add(message)
  }

}
