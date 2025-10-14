package org.finos.toolbox.collection.window

trait MovingWindow[DATA] extends Iterable[DATA] {
  def setAtIndex(index: Int, data: DATA): Unit
  def getAtIndex(index: Int): Option[DATA]
  def bufferSize: Int
  def isWithinRange(index: Int): Boolean
  def setRange(from: Int, to: Int): Unit
  def getRange: WindowRange
  //def empty(): Unit
  override def iterator: Iterator[DATA]
  def copy(): MovingWindow[DATA]
}
