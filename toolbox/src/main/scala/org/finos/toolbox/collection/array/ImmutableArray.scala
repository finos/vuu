package org.finos.toolbox.collection.array

import org.finos.toolbox.collection.set.{ImmutableArraySet, VectorImmutableArraySet}
import org.finos.toolbox.collection.set.ImmutableArraySet.{empty, of}

import scala.reflect.ClassTag

object ImmutableArray {

  def from[T <: Object](iterable: IterableOnce[T])(implicit c: ClassTag[T]): ImmutableArray[T] = {
    if (iterable.knownSize == 0) {
      empty()
    } else if (iterable.knownSize == 1) {
      of(iterable.iterator.next())
    } else {
      VectorImmutableArray.from(iterable)
    }
  }
  
  def empty[T <: Object](implicit c: ClassTag[T]): ImmutableArray[T] = {
    VectorImmutableArray.empty()
  }

  def of[T <: Object](element: T)(implicit c: ClassTag[T]): ImmutableArray[T] = {
    VectorImmutableArray.of(element)
  }

}

object ImmutableArrays{
  def empty[T <: Object :ClassTag](i: Int): Array[ImmutableArray[T]] = {
    (0 until i).map(i => ImmutableArray.empty()).toArray
  }
}

trait ImmutableArray[T] extends Iterable[T] {

  def +(element: T) : ImmutableArray[T]
  def add(element: T) : ImmutableArray[T]

  def -(element: T): ImmutableArray[T]
  def remove(element: T): ImmutableArray[T]

  def ++(iterable: IterableOnce[T]) : ImmutableArray[T]
  def addAll(iterable: IterableOnce[T]) : ImmutableArray[T]

  def indexOf(element: T): Int

  def contains(element: T): Boolean

  def length: Int

  def apply(i: Int): T

  def set(index: Int, element: T): ImmutableArray[T]

  def remove(index: Int): ImmutableArray[T]

}
