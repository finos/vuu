package io.venuu.toolbox.collection.window

trait MovingWindow[DATA] {
  def setAtIndex(index: Int, data: DATA): Unit
  def getAtIndex(index: Int): Option[DATA]
  def bufferSize(): Int
  def isWithinRange(index: Int): Boolean
  def setRange(from: Int, to: Int)
  def getRange(): WindowRange

}
