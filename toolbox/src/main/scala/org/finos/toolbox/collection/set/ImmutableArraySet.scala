package org.finos.toolbox.collection.set

import org.finos.toolbox.collection.array.ImmutableArray

import scala.reflect.ClassTag

trait ImmutableArraySet[T] extends Iterable[T] {

  def +(element: T): ImmutableArraySet[T]

  def add(element: T): ImmutableArraySet[T]
  
  def -(element: T): ImmutableArraySet[T]

  def remove(element: T): ImmutableArraySet[T]

  def ++(iterable: IterableOnce[T]): ImmutableArraySet[T]

  def addAll(iterable: IterableOnce[T]): ImmutableArraySet[T]

  def contains(element: T): Boolean

  def length: Int

  def toImmutableArray: ImmutableArray[T]

}

object ImmutableArraySet {

  def from[T <: Object](iterable: IterableOnce[T])(implicit c: ClassTag[T]): ImmutableArraySet[T] = {
    if (iterable.knownSize == 0) {
      empty()
    } else if (iterable.knownSize == 1) {
      of(iterable.iterator.next())
    } else {
      VectorImmutableArraySet.from(iterable)
    }
  }

  def empty[T <: Object](implicit c: ClassTag[T]): ImmutableArraySet[T] = {
    VectorImmutableArraySet.empty()
  }

  def of[T <: Object](value: T)(implicit c: ClassTag[T]): ImmutableArraySet[T] = {
    VectorImmutableArraySet.of(value)
  }

}
