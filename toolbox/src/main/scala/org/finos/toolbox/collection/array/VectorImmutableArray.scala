package org.finos.toolbox.collection.array

import com.typesafe.scalalogging.Logger
import org.roaringbitmap.buffer.CopyOnWriteRoaringBitmap

import scala.reflect.ClassTag
import scala.util.hashing.MurmurHash3

trait VectorImmutableArray[T] extends ImmutableArray[T] {}

object VectorImmutableArray {

  val logger: Logger = Logger.apply(classOf[VectorImmutableArray[_]])
  val minimumCompactionSize: Int = 1_026

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArray[T] = {
    val data = Vector.from(iterable)
    val bitMap = new CopyOnWriteRoaringBitmap
    bitMap.add(0L, data.length.toLong)
    VectorImmutableArrayImpl(data, bitMap, data.length)
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    VectorImmutableArrayImpl(Vector.empty, new CopyOnWriteRoaringBitmap, 0)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    val data = Vector(element)
    val bitMap = new CopyOnWriteRoaringBitmap
    bitMap.add(0)
    VectorImmutableArrayImpl(data, bitMap, 1)
  }

}

private class VectorImmutableArrayImpl[T <: Object : ClassTag](private val data: Vector[T],
                                                               private val activeIndices: CopyOnWriteRoaringBitmap,
                                                               override val length: Int) extends VectorImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = {
    val newData = data.appended(element)
    val newActive = activeIndices.clone()
    newActive.add(data.length)
    VectorImmutableArrayImpl(newData, newActive, length + 1)
  }

  override def remove(element: T): ImmutableArray[T] = {
    val logicalIndex = indexOf(element)
    if (logicalIndex < 0) this
    else remove(logicalIndex)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    val newData = data.appendedAll(iterable)
    val newActive = activeIndices.clone()
    newActive.add(data.length.toLong, newData.length.toLong)
    VectorImmutableArrayImpl(newData, newActive, length + (newData.length - data.length))
  }

  override def indexOf(element: T): Int = {
    var index = 0
    val it = activeIndices.getIntIterator
    while (it.hasNext) {
      if (data(it.next()) == element) return index
      index += 1
    }
    -1
  }

  override def contains(element: T): Boolean = indexOf(element) != -1

  override def apply(logicalIndex: Int): T = {
    checkIndex(logicalIndex)
    val physicalIndex = activeIndices.select(logicalIndex)
    data(physicalIndex)
  }

  override def set(logicalIndex: Int, element: T): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    val physicalIndex = activeIndices.select(logicalIndex)
    VectorImmutableArrayImpl(data.updated(physicalIndex, element), activeIndices, length)
  }

  override def remove(logicalIndex: Int): ImmutableArray[T] = {
    checkIndex(logicalIndex)
    val physicalIndex = activeIndices.select(logicalIndex)
    doRemove(physicalIndex)
  }

  override def iterator: Iterator[T] = {
    val iterator = new Iterator[Int] {
      private val it = activeIndices.getIntIterator
      def hasNext: Boolean = it.hasNext
      def next(): Int = it.next()
    }
    iterator.map(data(_))
  }

  override def foreach[U](f: T => U): Unit = {
    val it = activeIndices.getIntIterator
    while (it.hasNext) {
      f(data(it.next()))
    }
  }

  private def checkIndex(logicalIndex: Int): Unit = {
    if (logicalIndex < 0 || logicalIndex >= length) throw new IndexOutOfBoundsException(s"Index $logicalIndex")
  }

  private def doRemove(physicalIndex: Int): VectorImmutableArray[T] = {
    val newActive = activeIndices.clone()
    newActive.remove(physicalIndex)
    if (shouldCompact) {
      compact(newActive)
    } else {
      VectorImmutableArrayImpl(data.updated(physicalIndex, null.asInstanceOf[T]), newActive, length - 1)
    }
  }

  private def shouldCompact: Boolean = {
    val capacity = data.length
    if (capacity < VectorImmutableArray.minimumCompactionSize) {
      false
    } else {
      val lowerPowerOfTwo = Integer.highestOneBit(capacity - 1)
      val halfThreshold = lowerPowerOfTwo / 2
      length < halfThreshold
    }
  }

  private def compact(newActive: CopyOnWriteRoaringBitmap) = {
    val newLength = length - 1
    VectorImmutableArray.logger.trace(s"Compacting ${data.length - newLength} records")
    val dataBuilder = Vector.newBuilder[T]
    dataBuilder.sizeHint(newLength)
    val it = newActive.getIntIterator
    while (it.hasNext) {
      dataBuilder.addOne(data(it.next()))
    }
    val newData = dataBuilder.result()
    val finalActive = new CopyOnWriteRoaringBitmap
    finalActive.add(0L, newLength.toLong)
    VectorImmutableArrayImpl(newData, finalActive, newLength)
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
