package org.finos.toolbox.collection.window

import scala.reflect.ClassTag

class ArrayBackedMovingWindow[DATA <: AnyRef](val bufferSize: Int)(implicit m: ClassTag[DATA]) extends MovingWindow[DATA] {

  val lock = new Object

  //internal data is always 0 based, we add range.from to determine an offset
  @volatile var internalData = new Array[DATA](bufferSize)
  @volatile var range = new WindowRange(0, bufferSize)

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

      this.range = WindowRange(from, to)
    }
  }

  override def getRange: WindowRange = range

  override def iterator: Iterator[DATA] = this.internalData.iterator

  override def copy(): MovingWindow[DATA] = {
    lock.synchronized {
      val newWindow = new ArrayBackedMovingWindow[DATA](bufferSize = this.bufferSize)
      newWindow.range = new WindowRange(range.from, range.to)
      newWindow.internalData = this.internalData.clone()
      newWindow
    }
  }
}