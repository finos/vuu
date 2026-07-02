package org.finos.toolbox.collection.window

import scala.reflect.ClassTag

trait MovingWindow[DATA] extends Iterable[DATA] {
  def setAtIndex(index: Int, data: DATA): Unit
  def getAtIndex(index: Int): Option[DATA]
  def bufferSize: Int
  def isWithinRange(index: Int): Boolean
  def setRange(from: Int, to: Int): Unit
  def getRange: WindowRange
  override def iterator: Iterator[DATA]
  def copy(): MovingWindow[DATA]
}

object MovingWindow {

  def apply[DATA <: AnyRef : ClassTag](cacheSize: Int): MovingWindow[DATA] = {
    new ArrayBackedMovingWindow[DATA](cacheSize)
  }

}
