package org.finos.toolbox.collection.array

import org.roaringbitmap.buffer.CopyOnWriteRoaringBitmap

import scala.reflect.ClassTag
import scala.util.hashing.MurmurHash3

trait VectorImmutableArray[T] extends ImmutableArray[T] {}

object VectorImmutableArray {

  val minimumCompactionSize: Int = 4_096

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArray[T] = {
    val data = Vector.from(iterable)
    new VectorImmutableArrayImpl(data, null, data.length)
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    new VectorImmutableArrayImpl(Vector.empty, null, 0)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    new VectorImmutableArrayImpl(Vector(element), null, 1)
  }

}

private class VectorImmutableArrayImpl[T <: Object : ClassTag](
                                                                private val data: Vector[T],
                                                                private val activeIndices: CopyOnWriteRoaringBitmap,
                                                                override val length: Int
                                                              ) extends VectorImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = {
    val newData = data.appended(element)
    if (activeIndices == null) {
      new VectorImmutableArrayImpl(newData, null, length + 1)
    } else {
      val newActive = activeIndices.clone()
      newActive.add(data.length)
      new VectorImmutableArrayImpl(newData, newActive, length + 1)
    }
  }

  override def remove(element: T): ImmutableArray[T] = {
    val logicalIndex = indexOf(element)
    if (logicalIndex < 0) this
    else remove(logicalIndex)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    val newData = data.appendedAll(iterable)
    if (activeIndices == null) {
      new VectorImmutableArrayImpl(newData, null, newData.length)
    } else {
      val newActive = activeIndices.clone()
      newActive.add(data.length.toLong, newData.length.toLong)
      new VectorImmutableArrayImpl(newData, newActive, length + (newData.length - data.length))
    }
  }

  override def indexOf(element: T): Int = {
    if (activeIndices == null) {
      data.indexOf(element)
    } else {
      val it = data.iterator
      var physicalIndex = 0
      while (it.hasNext) {
        val current = it.next()
        if (current == element) {
          if (activeIndices.contains(physicalIndex)) {
            return activeIndices.rank(physicalIndex) - 1
          }
        }
        physicalIndex += 1
      }
      -1
    }
  }

  override def contains(element: T): Boolean = indexOf(element) != -1

  override def apply(logicalIndex: Int): T = {
    checkIndex(logicalIndex)
    if (activeIndices == null) {
      data(logicalIndex)
    } else {
      val physicalIndex = activeIndices.select(logicalIndex)
      data(physicalIndex)
    }
  }

  override def set(logicalIndex: Int, element: T): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    if (activeIndices == null) {
      new VectorImmutableArrayImpl(data.updated(logicalIndex, element), null, length)
    } else {
      val physicalIndex = activeIndices.select(logicalIndex)
      new VectorImmutableArrayImpl(data.updated(physicalIndex, element), activeIndices, length)
    }
  }

  override def remove(logicalIndex: Int): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    val newLength = length - 1

    val physicalIndex = if (activeIndices == null) logicalIndex else activeIndices.select(logicalIndex)

    val newActive = if (activeIndices == null) {
      val bm = new CopyOnWriteRoaringBitmap
      bm.add(0L, data.length.toLong)
      bm
    } else {
      activeIndices.clone()
    }
    newActive.remove(physicalIndex)

    if (shouldCompact(newActive, newLength)) {
      compact(newActive, newLength)
    } else {
      new VectorImmutableArrayImpl(data.updated(physicalIndex, null.asInstanceOf[T]), newActive, newLength)
    }
  }

  override def iterator: Iterator[T] = {
    if (activeIndices == null) {
      data.iterator
    } else {
      new Iterator[T] {
        private val it = activeIndices.getIntIterator
        override def hasNext: Boolean = it.hasNext
        override def next(): T = data(it.next())
      }
    }
  }

  override def foreach[U](f: T => U): Unit = {
    if (activeIndices == null) {
      data.foreach(f)
    } else {
      val it = activeIndices.getIntIterator
      while (it.hasNext) {
        f(data(it.next()))
      }
    }
  }

  override def knownSize: Int = length

  private def checkIndex(logicalIndex: Int): Unit = {
    if (logicalIndex < 0 || logicalIndex >= length) throw new IndexOutOfBoundsException(s"Index $logicalIndex")
  }

  private def shouldCompact(newActive: CopyOnWriteRoaringBitmap, newLength: Int): Boolean = {
    val dataLength = data.length
    if (dataLength < VectorImmutableArray.minimumCompactionSize) {
      false
    } else {
      val lowerPowerOfTwo = Integer.highestOneBit(dataLength - 1)
      val halfThreshold = lowerPowerOfTwo / 2
      newLength < halfThreshold
    }
  }

  private def compact(newActive: CopyOnWriteRoaringBitmap, newLength: Int): VectorImmutableArrayImpl[T] = {
    val dataBuilder = Vector.newBuilder[T]
    dataBuilder.sizeHint(newLength)
    val it = newActive.getIntIterator
    while (it.hasNext) {
      dataBuilder.addOne(data(it.next()))
    }
    val newData = dataBuilder.result()
    new VectorImmutableArrayImpl(newData, null, newLength)
  }

  private lazy val hash = MurmurHash3.orderedHash(this.iterator)

  override def hashCode(): Int = hash

  override def equals(other: Any): Boolean = other match {
    case that: VectorImmutableArrayImpl[_] =>
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
