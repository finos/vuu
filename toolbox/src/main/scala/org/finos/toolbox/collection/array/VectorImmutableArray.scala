package org.finos.toolbox.collection.array

import scala.reflect.ClassTag

object VectorImmutableArray {

  def from[T <: Object : ClassTag](arr: IterableOnce[T]): ImmutableArray[T] = {
    new VectorImmutableArray[T](Vector.from(arr))
  }

  def empty[T <: Object : ClassTag](): ImmutableArray[T] = {
    new VectorImmutableArray[T](Vector.empty)
  }

  def of[T <: Object : ClassTag](element: T): ImmutableArray[T] = {
    new VectorImmutableArray[T](Vector(element))
  }

}

private class VectorImmutableArray[T <: Object :ClassTag](private val vector: Vector[T]) extends ImmutableArray[T] {

  override def +(element: T): ImmutableArray[T] = add(element)

  override def -(element: T): ImmutableArray[T] = remove(element)

  override def ++(iterable: IterableOnce[T]): ImmutableArray[T] = addAll(iterable)

  override def add(element: T): ImmutableArray[T] = VectorImmutableArray(vector.appended(element))

  override def remove(element: T): ImmutableArray[T] = {
    val index = vector.indexOf(element)
    if (index >= 0) remove(index) else this
  }

  override def addAll(iterable: IterableOnce[T]): ImmutableArray[T] = {
    VectorImmutableArray(vector.appendedAll(iterable))
  }

  override def getIndex(index: Int): T = {
    vector(index)
  }

  override def indexOf(element: T): Int = {
    vector.indexOf(element)
  }

  override def contains(element: T): Boolean = vector.contains(element)

  override def length: Int = vector.length

  override def apply(i: Int): T = vector(i)

  override def set(index: Int, element: T): ImmutableArray[T] = VectorImmutableArray(vector.updated(index, element))

  override def remove(index: Int): ImmutableArray[T] = VectorImmutableArray(vector.patch(index, Nil, 1))

  override def iterator: Iterator[T] = vector.iterator

  private lazy val hash = vector.hashCode()

  override def hashCode(): Int = hash

  override def equals(obj: Any): Boolean = {
    obj match {
      case that: VectorImmutableArray[_] =>
        (this eq that) || (this.vector == that.vector)
      case _ => false
    }
  }

}
