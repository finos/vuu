/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 02/01/15.

 */
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
