package org.finos.toolbox.collection.window

import scala.reflect.ClassTag

class WindowRange(var from: Int, var to: Int) {

  def isWithin(index: Int): Boolean = {
    index >= from && index < to
  }

  //find the overlap of this range and a new one
  def overlap(from: Int, to: Int): (Int, Int) = {
    if (from >= this.to || to < this.from) {
      (0, 0)
    } else {
      (Math.max(from, this.from), Math.min(to, this.to))
    }
  }

  def copy(): WindowRange = new WindowRange(this.from, this.to)
}

class ArrayBackedMovingWindow[DATA <: AnyRef](val bufferSize: Int)(implicit m: ClassTag[DATA]) extends MovingWindow[DATA] {

  val range = new WindowRange(0, bufferSize)
  val lock = new Object

  //internal data is always 0 based, we add range.from to determine an offset
  @volatile var internalData = new Array[DATA](bufferSize)

  override def setAtIndex(index: Int, data: DATA): Unit = {
    lock.synchronized {
      if(isWithinRange(index)){
        internalData(index - range.from) = data
      }
    }
  }

  override def getAtIndex(index: Int): Option[DATA] = {
    lock.synchronized {
      if (range.isWithin(index) && internalData(index - range.from) != null) Some(internalData(index - range.from)) else None
    }
  }

  override def isWithinRange(index: Int): Boolean = {
    lock.synchronized {
      range.isWithin(index)
    }
  }

  override def setRange(from: Int, to: Int): Unit = {
    lock.synchronized {
      val (overlapFrom, overlapTo) = this.range.overlap(from, to)

      var newData = new Array[DATA](to - from)

      (overlapFrom to (overlapTo - 1)).foreach(i => {
        getAtIndex(i) match {
          case Some(data) =>
            newData(i - from) = data
          case None =>
        }
      })

      internalData = newData

      this.range.from = from
      this.range.to = to
    }
  }

  override def getRange: WindowRange = range.copy()

  override def iterator: Iterator[DATA] = this.internalData.iterator

  override def copy(): MovingWindow[DATA] = {
    lock.synchronized {
      val newWindow = new ArrayBackedMovingWindow[DATA](bufferSize = this.bufferSize)
      newWindow.range.from = this.range.from
      newWindow.range.to = this.range.to
      newWindow.internalData = this.internalData.clone()
      newWindow
    }
  }
}
