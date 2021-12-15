package io.venuu.vuu.client.swing

import java.util.concurrent.CopyOnWriteArrayList
import scala.jdk.CollectionConverters._

class EventBus[T] {

  private val callbacks = new CopyOnWriteArrayList[T => Unit ]()

  def register(callback: T => Unit): Unit = {
    callbacks.add(callback)
  }

  def publish(message: T) = {
    ListHasAsScala(callbacks).asScala.foreach( c => c.apply(message) )
  }

}
