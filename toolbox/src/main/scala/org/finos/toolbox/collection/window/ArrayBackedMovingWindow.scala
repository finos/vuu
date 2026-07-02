package org.finos.toolbox.collection.window

import scala.reflect.ClassTag

class ArrayBackedMovingWindow[DATA <: AnyRef](initialBufferSize: Int)(implicit m: ClassTag[DATA]) extends MovingWindow[DATA] {

  private val lock = new Object

  @volatile private var range = new WindowRange(0, initialBufferSize)
  @volatile private var internalData = new Array[DATA](initialBufferSize)

  override def bufferSize: Int = {
    val currentRange = range
    currentRange.to - currentRange.from
  }

  // Exposed exclusively for unit testing allocation behaviour
  def internalArrayIdentity: Int = lock.synchronized { System.identityHashCode(internalData) }

  private def getPhysicalIndex(virtualIndex: Int, arrayLength: Int): Int = {
    val mod = virtualIndex % arrayLength
    if (mod < 0) mod + arrayLength else mod
  }

  override def setAtIndex(index: Int, data: DATA): Unit = {
    lock.synchronized {
      val currentRange = this.range
      if (index >= currentRange.from && index < currentRange.to) {
        internalData(getPhysicalIndex(index, internalData.length)) = data
      }
    }
  }

  override def getAtIndex(index: Int): Option[DATA] = {
    val currentRange = this.range
    if (index >= currentRange.from && index < currentRange.to) {
      Option(internalData(getPhysicalIndex(index, internalData.length)))
    } else None
  }

  override def isWithinRange(index: Int): Boolean = {
    val currentRange = this.range
    index >= currentRange.from && index < currentRange.to
  }

  override def setRange(from: Int, to: Int): Unit = {
    lock.synchronized {
      val currentRange = this.range
      val curFrom = currentRange.from
      val curTo = currentRange.to
      val newSize = to - from

      // 1. Eliminate Tuple Allocation: Inline the intersection calculations directly
      val hasOverlap = !(from >= curTo || to <= curFrom)
      val overlapFrom = if (hasOverlap) Math.max(from, curFrom) else 0
      val overlapTo = if (hasOverlap) Math.min(to, curTo) else 0

      val oldLen = internalData.length

      if (newSize > oldLen) {
        // Allocate only when growth is an absolute physical necessity
        val newData = new Array[DATA](newSize)
        if (overlapFrom < overlapTo) {
          var i = overlapFrom
          while (i < overlapTo) {
            val oldPhys = getPhysicalIndex(i, oldLen)
            val newPhys = getPhysicalIndex(i, newSize)
            newData(newPhys) = internalData(oldPhys)
            i += 1
          }
        }
        this.internalData = newData
      } else {
        // 2. Zero-Allocation & Zero-Data-Movement Sliding Optimization
        if (overlapFrom < overlapTo) {
          var i = curFrom
          while (i < curTo) {
            // Null out elements falling outside the new window layout using a primitive loop
            if (!(i >= from && i < to)) {
              internalData(getPhysicalIndex(i, oldLen)) = null.asInstanceOf[DATA]
            }
            i += 1
          }
        } else {
          // Disjoint range jump: Reset references using a fast loop instead of generating new arrays
          var j = 0
          while (j < oldLen) {
            internalData(j) = null.asInstanceOf[DATA]
            j += 1
          }
        }
      }
      this.range = new WindowRange(from, to)
    }
  }

  override def getRange: WindowRange = range

  override def iterator: Iterator[DATA] = {
    val currentRange = this.range
    val startVirtual = currentRange.from
    val endVirtual = currentRange.to

    new Iterator[DATA] {
      private var currentVirtual = startVirtual
      private var nextElement: DATA = null.asInstanceOf[DATA]
      private var lookedAhead = false

      private def lookAhead(): Unit = {
        if (!lookedAhead) {
          val dataRef = internalData
          val len = dataRef.length
          while (currentVirtual < endVirtual && nextElement == null) {
            val physIdx = getPhysicalIndex(currentVirtual, len)
            nextElement = dataRef(physIdx)
            currentVirtual += 1
          }
          lookedAhead = true
        }
      }

      override def hasNext: Boolean = {
        lookAhead()
        nextElement != null
      }

      override def next(): DATA = {
        if (!hasNext) throw new NoSuchElementException("End of window iteration")
        val res = nextElement
        nextElement = null.asInstanceOf[DATA]
        lookedAhead = false
        res
      }
    }
  }

  override def copy(): MovingWindow[DATA] = {
    lock.synchronized {
      val newWindow = new ArrayBackedMovingWindow[DATA](this.internalData.length)
      newWindow.range = this.range
      newWindow.internalData = this.internalData.clone()
      newWindow
    }
  }
}