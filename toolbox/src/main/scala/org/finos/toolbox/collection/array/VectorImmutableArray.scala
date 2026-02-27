package org.finos.toolbox.collection.array

import com.typesafe.scalalogging.Logger
import org.roaringbitmap.buffer.CopyOnWriteRoaringBitmap

import scala.reflect.ClassTag
import scala.util.hashing.MurmurHash3

trait VectorImmutableArray[T] extends ImmutableArray[T] {}

object VectorImmutableArray {

  private val logger: Logger = Logger.apply(classOf[VectorImmutableArray[_]])

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArray[T] = {
    val data = Vector.from(iterable)
    val bitMap = new CopyOnWriteRoaringBitmap
    bitMap.add(0L, data.length.toLong)
    VectorImmutableArrayImpl(data, bitMap, logger)
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    VectorImmutableArrayImpl(Vector.empty, new CopyOnWriteRoaringBitmap, logger)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    val data = Vector(element)
    val bitMap = new CopyOnWriteRoaringBitmap
    bitMap.add(0)
    VectorImmutableArrayImpl(data, bitMap, logger)
  }

}

private class VectorImmutableArrayImpl[T <: Object : ClassTag](private val data: Vector[T],
                                                               private val activeIndices: CopyOnWriteRoaringBitmap,
                                                               logger: Logger) extends VectorImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = {
    val newData = data.appended(element)
    val newActive = activeIndices.clone()
    newActive.add(data.length)
    VectorImmutableArrayImpl(newData, newActive, logger)
  }

  override def remove(element: T): ImmutableArray[T] = {
    val physIdx = indexOf(element)
    if (physIdx == -1) this
    else doRemove(physIdx)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    val newData = data ++ iterable
    val newActive = activeIndices.clone()
    newActive.add(data.length.toLong, newData.length.toLong)
    VectorImmutableArrayImpl(newData, newActive, logger)
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

  override def apply(index: Int): T = {
    if (index < 0 || index >= length) throw new IndexOutOfBoundsException(s"Index $index")
    val physIdx = activeIndices.select(index)
    data(physIdx)
  }

  override def set(index: Int, element: T): ImmutableArray[T] = {
    if (index < 0 || index >= length) throw new IndexOutOfBoundsException(s"Index $index")
    val physIdx = activeIndices.select(index)
    VectorImmutableArrayImpl(data.updated(physIdx, element), activeIndices, logger)
  }

  override def remove(index: Int): ImmutableArray[T] = {
    if (index < 0 || index >= length) throw new IndexOutOfBoundsException(s"Index $index")
    val physIdx = activeIndices.select(index)
    doRemove(physIdx)
  }

  private lazy val activeLength = activeIndices.getCardinality

  override def length: Int = activeLength

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

  private def doRemove(physIdx: Int): VectorImmutableArray[T] = {
    val newActive = activeIndices.clone()
    newActive.remove(physIdx)
    if (shouldCompact) {
      compact(newActive)
    } else {
      VectorImmutableArrayImpl(data, newActive, logger)
    }
  }

  private def shouldCompact: Boolean = {
    data.length - length > Math.max(100, data.length * 0.10)
  }

  private def compact(newActive: CopyOnWriteRoaringBitmap) = {
    logger.trace(s"Compacting ${data.length - length} records")
    val dataBuilder = Vector.newBuilder[T]
    dataBuilder.sizeHint(newActive.getCardinality)
    val it = newActive.getIntIterator
    while (it.hasNext) {
      dataBuilder += data(it.next())
    }
    val newData = dataBuilder.result()
    val finalActive = new CopyOnWriteRoaringBitmap
    finalActive.add(0L, newData.length.toLong)
    VectorImmutableArrayImpl(newData, finalActive, logger)
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
