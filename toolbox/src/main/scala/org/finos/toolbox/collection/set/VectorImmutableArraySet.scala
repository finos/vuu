package org.finos.toolbox.collection.set

import org.finos.toolbox.collection.array.{ImmutableArray, VectorImmutableArray}

import scala.collection.mutable
import scala.reflect.ClassTag

object VectorImmutableArraySet {

  def of[T <: Object : ClassTag](value: T): ImmutableArraySet[T] = {
    new VectorImmutableArraySet[T](Vector(value), Set(value))
  }

  def from[T <: Object : ClassTag](iterable: IterableOnce[T]): ImmutableArraySet[T] = {
    val seen = mutable.HashSet.empty[T]
    val builder = Vector.newBuilder[T]

    val iterator = iterable.iterator
    if (iterator.knownSize > 0) {
      builder.sizeHint(iterator.knownSize)
    }

    while (iterator.hasNext) {
      val elem = iterator.next()
      if (seen.add(elem)) {
        builder += elem
      }
    }

    VectorImmutableArraySet(builder.result(), seen.toSet)
  }

  def from[T <: Object : ClassTag](set: Set[T]): ImmutableArraySet[T] = {
    VectorImmutableArraySet(set.toVector, set)
  }

  def empty[T <: Object : ClassTag](): ImmutableArraySet[T] = {
    VectorImmutableArraySet[T](Vector.empty, Set.empty)
  }

}

private class VectorImmutableArraySet[T <: Object :ClassTag](private val vector: Vector[T], private val set: Set[T]) extends ImmutableArraySet[T] {

  override def +(element: T): ImmutableArraySet[T] = add(element)

  override def -(element: T): ImmutableArraySet[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArraySet[T] = addAll(iterable)

  override def add(element: T): ImmutableArraySet[T] = {
    if (contains(element)) this
    else VectorImmutableArraySet(vector :+ element, set + element)
  }

  override def remove(element: T): ImmutableArraySet[T] = {
    if (!contains(element)) this
    else VectorImmutableArraySet(vector.patch(vector.indexOf(element), Nil, 1), set - element)
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArraySet[T] = {
    if (iterable.knownSize == 0) {
      this
    } else if (iterable.knownSize == 1) {
      add(iterable.iterator.next())
    } else {
      val seen = mutable.HashSet.from(set)
      val builder = Vector.newBuilder[T]

      val iterator = iterable.iterator
      if (iterator.knownSize > 0) {
        builder.sizeHint(vector.size + iterator.knownSize)
      }

      builder ++= vector
      iterator.foreach { elem =>
        if (seen.add(elem)) {
          builder += elem
        }
      }

      VectorImmutableArraySet(builder.result(), seen.toSet)
    }
  }

  override def contains(element: T): Boolean = set.contains(element)

  override def length: Int = vector.length

  override def iterator: Iterator[T] = vector.iterator

  override def foreach[U](f: T => U): Unit = vector.foreach(f)

  override def size: Int = vector.size

  override def knownSize: Int = vector.knownSize

  override def isEmpty: Boolean = vector.isEmpty

  override def head: T = vector.head

  override def last: T = vector.last

  override def headOption: Option[T] = vector.headOption

  override def lastOption: Option[T] = vector.lastOption

  override def slice(from: Int, until: Int): Iterable[T] = {
    vector.slice(from, until)
  }

  override def take(n: Int): Iterable[T] = vector.take(n)

  override def drop(n: Int): Iterable[T] = vector.drop(n)

  override def copyToArray[B >: T](xs: Array[B], start: Int, len: Int): Int = {
    vector.copyToArray(xs, start, len)
  }

  override def toImmutableArray: ImmutableArray[T] = VectorImmutableArray.from(vector)

  private lazy val hash = vector.hashCode()

  override def hashCode(): Int = hash

  override def equals(obj: Any): Boolean = {
    obj match {
      case that: VectorImmutableArraySet[_] =>
        (this eq that) || (this.vector == that.vector)
      case _ => false
    }
  }

}
