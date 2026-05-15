package org.finos.toolbox.collection.array

import org.roaringbitmap.buffer.CopyOnWriteRoaringBitmap

import scala.reflect.ClassTag
import scala.util.hashing.MurmurHash3

trait VectorImmutableArray[T] extends ImmutableArray[T] {}

object VectorImmutableArray {

  val minimumCompactionSize: Int = 4_096

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArray[T] = {
    val data = Vector.from(iterable)
    VectorImmutableArrayImpl(data, new CopyOnWriteRoaringBitmap, data.length)
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    VectorImmutableArrayImpl(Vector.empty, new CopyOnWriteRoaringBitmap, 0)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    val data = Vector(element)
    VectorImmutableArrayImpl(data, new CopyOnWriteRoaringBitmap, 1)
  }

}

private class VectorImmutableArrayImpl[T <: Object : ClassTag](private val data: Vector[T],
                                                               private val removedIndices: CopyOnWriteRoaringBitmap,
                                                               override val length: Int) extends VectorImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = {
    val newData = data.appended(element)
    VectorImmutableArrayImpl(newData, removedIndices, length + 1)
  }

  override def remove(element: T): ImmutableArray[T] = {
    val logicalIndex = indexOf(element)
    if (logicalIndex < 0) this
    else doRemove(logicalIndex)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    val newData = data.appendedAll(iterable)
    VectorImmutableArrayImpl(newData, removedIndices, length + (newData.length - data.length))
  }

  override def indexOf(element: T): Int = {
    val it = data.iterator
    var physicalIndex = 0
    while (it.hasNext) {
      val current = it.next()
      if (current == element) {
        if (!removedIndices.contains(physicalIndex)) {
          return physicalIndex - removedIndices.rank(physicalIndex)
        }
      }
      physicalIndex += 1
    }
    -1
  }

  override def contains(element: T): Boolean = indexOf(element) != -1

  override def apply(logicalIndex: Int): T = {
    checkIndex(logicalIndex)
    val physicalIndex = logicalToPhysical(logicalIndex)
    data(physicalIndex)
  }

  override def set(logicalIndex: Int, element: T): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    val physicalIndex = logicalToPhysical(logicalIndex)
    VectorImmutableArrayImpl(data.updated(physicalIndex, element), removedIndices, length)
  }

  override def remove(logicalIndex: Int): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    doRemove(logicalIndex)
  }

  override def iterator: Iterator[T] = new Iterator[T] {
    private val remIt = removedIndices.getIntIterator
    private var nextRem = if (remIt.hasNext) remIt.next() else -1
    private var physIdx = -1
    advance()

    private def advance(): Unit = {
      physIdx += 1
      while (physIdx < data.length && physIdx == nextRem) {
        physIdx += 1
        nextRem = if (remIt.hasNext) remIt.next() else -1
      }
    }

    override def hasNext: Boolean = physIdx < data.length

    override def next(): T = {
      val result = data(physIdx)
      advance()
      result
    }
  }

  override def foreach[U](f: T => U): Unit = {
    val remIt = removedIndices.getIntIterator
    var nextRem = if (remIt.hasNext) remIt.next() else -1
    var physIdx = 0

    while (physIdx < data.length) {
      if (physIdx == nextRem) {
        nextRem = if (remIt.hasNext) remIt.next() else -1
      } else {
        f(data(physIdx))
      }
      physIdx += 1
    }
  }

  private def logicalToPhysical(logicalIndex: Int): Int = {
    if (removedIndices.isEmpty) return logicalIndex
    var low = logicalIndex
    var high = data.length - 1
    while (low < high) {
      val mid = low + (high - low) / 2
      val logicalAtMid = mid - removedIndices.rank(mid)
      if (logicalAtMid >= logicalIndex) high = mid
      else low = mid + 1
    }
    low
  }

  private def checkIndex(logicalIndex: Int): Unit = {
    if (logicalIndex < 0 || logicalIndex >= length) throw new IndexOutOfBoundsException(s"Index $logicalIndex")
  }

  private def doRemove(logicalIndex: Int): VectorImmutableArray[T] = {
    val newLength = length - 1
    val physicalIndex = logicalToPhysical(logicalIndex)
    val newRemoved = removedIndices.clone()
    newRemoved.add(physicalIndex)
    if (shouldCompact) {
      compact(newRemoved, newLength)
    } else {
      VectorImmutableArrayImpl(data.updated(physicalIndex, null.asInstanceOf[T]), newRemoved, newLength)
    }
  }

  private def shouldCompact: Boolean = {
    val dataLength = data.length
    if (dataLength < VectorImmutableArray.minimumCompactionSize) {
      false
    } else {
      val lowerPowerOfTwo = Integer.highestOneBit(dataLength - 1)
      val halfThreshold = lowerPowerOfTwo / 2
      length < halfThreshold
    }
  }

  private def compact(newRemoved: CopyOnWriteRoaringBitmap, newLength: Int) = {
    val dataBuilder = Vector.newBuilder[T]
    dataBuilder.sizeHint(newLength)

    val remIt = newRemoved.getIntIterator
    var nextRem = if (remIt.hasNext) remIt.next() else -1
    var physIdx = 0

    while (physIdx < data.length) {
      if (physIdx == nextRem) {
        nextRem = if (remIt.hasNext) remIt.next() else -1
      } else {
        dataBuilder.addOne(data(physIdx))
      }
      physIdx += 1
    }
    val newData = dataBuilder.result()
    VectorImmutableArrayImpl(newData, new CopyOnWriteRoaringBitmap, newLength)
  }

  private lazy val hash = MurmurHash3.orderedHash(this.iterator)

  override def hashCode(): Int = hash

  override def equals(other: Any): Boolean = other match {
    case that: VectorImmutableArray[_] =>
      if (this eq that) true
      else if (this.length != that.length) false
      else if (this.hashCode() != that.hashCode()) false
      else {
        val it1 = this.iterator
        val it2 = that.iterator
        var same = true
        while (it1.hasNext && it2.hasNext && same) {
          if (it1.next() != it2.next()) same = false
        }
        same
      }
    case _ => false
  }

}
