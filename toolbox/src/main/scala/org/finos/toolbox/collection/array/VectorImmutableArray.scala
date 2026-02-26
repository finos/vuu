package org.finos.toolbox.collection.array

import com.typesafe.scalalogging.Logger

import scala.collection.immutable.BitSet
import scala.reflect.ClassTag
import scala.util.hashing.MurmurHash3

trait VectorImmutableArray[T] extends ImmutableArray[T] { }

object VectorImmutableArray {

  private val logger: Logger = Logger.apply(classOf[VectorImmutableArray[_]])

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArray[T] = {
    val dataBuilder = Vector.newBuilder[T]
    val bitSetBuilder = BitSet.newBuilder
    if (iterable.knownSize > 0) {
      dataBuilder.sizeHint(iterable.knownSize)
      bitSetBuilder.sizeHint(iterable.knownSize)
    }

    val it = iterable.iterator
    var addedCount = 0
    while (it.hasNext) {
      val item = it.next()
      dataBuilder += item
      bitSetBuilder += addedCount
      addedCount += 1
    }

    VectorImmutableArrayImpl(dataBuilder.result(), bitSetBuilder.result(), addedCount, logger)
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    new VectorImmutableArrayImpl[T](Vector.empty, BitSet.empty, 0, logger)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    new VectorImmutableArrayImpl[T](Vector(element), BitSet(0), 1, logger)
  }

}

private class VectorImmutableArrayImpl[T <: Object :ClassTag](private val data: Vector[T],
                                                          private val activeIndices: BitSet,
                                                          override val length: Int,
                                                          logger: Logger) extends VectorImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = {
    val newData = data.appended(element)
    val newActive = activeIndices + (newData.length - 1)
    VectorImmutableArrayImpl(newData, newActive, length + 1, logger)
  }

  override def remove(element: T): ImmutableArray[T] = {
    val physIdx = indexOf(element)
    if (physIdx == -1) this
    else doRemove(physIdx)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    val dataBuilder = Vector.newBuilder[T]
    val bitSetBuilder = BitSet.newBuilder
    if (iterable.knownSize > 0) {
      dataBuilder.sizeHint(data.length + iterable.knownSize)
      bitSetBuilder.sizeHint(data.length + iterable.knownSize)
    }
    dataBuilder ++= data
    bitSetBuilder ++= activeIndices

    val it = iterable.iterator
    var currentPhysicalIndex = data.length
    var addedCount = 0
    while (it.hasNext) {
      val item = it.next()
      dataBuilder += item
      bitSetBuilder += currentPhysicalIndex
      currentPhysicalIndex += 1
      addedCount += 1
    }

    VectorImmutableArrayImpl(dataBuilder.result(), bitSetBuilder.result(), length + addedCount, logger)
  }

  override def getIndex(index: Int): T = {
    apply(index)
  }

  override def indexOf(element: T): Int = {
    var index = 0
    val it = activeIndices.iterator
    while (it.hasNext) {
      if (data(it.next()) == element) return index
      index += 1
    }
    -1
  }

  override def contains(element: T): Boolean = indexOf(element) != -1

  override def apply(index: Int): T = {
    if (index < 0 || index >= length) throw new IndexOutOfBoundsException(s"Index $index")
    data(findPhysicalIndex(index))
  }

  override def set(index: Int, element: T): ImmutableArray[T] = {
    val physIdx = findPhysicalIndex(index)
    VectorImmutableArrayImpl(data.updated(physIdx, element), activeIndices, length, logger)
  }

  override def remove(index: Int): ImmutableArray[T] = {
    val physIdx = findPhysicalIndex(index)
    doRemove(physIdx)
  }

  override def iterator: Iterator[T] = activeIndices.iterator.map(data(_))

  override def foreach[U](f: T => U): Unit = {
    val it = activeIndices.iterator
    while (it.hasNext) {
      val physicalIndex = it.next()
      f(data(physicalIndex))
    }
  }

  private def findPhysicalIndex(userIndex: Int): Int = {
    var count = 0
    val it = activeIndices.iterator
    while (it.hasNext) {
      val physicalIdx = it.next()
      if (count == userIndex) return physicalIdx
      count += 1
    }
    throw new IndexOutOfBoundsException(s"Index $userIndex")
  }

  private def doRemove(physIdx: Int): VectorImmutableArray[T] = {
    val updated = VectorImmutableArrayImpl(data, activeIndices - physIdx, length - 1, logger)
    if (shouldCompact) {
      logger.trace(s"Compacting ${data.length - length} records")
      updated.compact()
    } else {
      updated
    }
  }

  private def shouldCompact: Boolean = {
    data.length - length > Math.max(100, data.length * 0.10)
  }

  private def compact(): VectorImmutableArray[T] = {
    val dataBuilder = Vector.newBuilder[T]
    dataBuilder.sizeHint(this.length)
    this.iterator.foreach(dataBuilder += _)
    val newData = dataBuilder.result()
    val newActive = BitSet.fromSpecific(newData.indices)
    VectorImmutableArrayImpl(newData, newActive, newData.length, logger)
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
