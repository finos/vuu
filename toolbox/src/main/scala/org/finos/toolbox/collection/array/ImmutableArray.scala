package org.finos.toolbox.collection.array

import scala.reflect.ClassTag

object ImmutableArray {

  def empty[T <: Object](implicit c: ClassTag[T]): ImmutableArray[T] = {
    ChunkedImmutableArray.empty()
  }

  def from[T <: Object](array: Array[T])(implicit c: ClassTag[T]): ImmutableArray[T] = {
    ChunkedImmutableArray.from(array)
  }

}

object ImmutableArrays{
  def empty[T <: Object :ClassTag](i: Int): Array[ImmutableArray[T]] = {
    (0 until i).map(i => ImmutableArray.empty()).toArray
  }
}

trait ImmutableArray[T] extends Iterable[T] {

  def +(element: T) : ImmutableArray[T]

  def -(element: T): ImmutableArray[T]
  def remove(element: T): ImmutableArray[T]

  def ++(arr: ImmutableArray[T]) : ImmutableArray[T]
  def addAll(arr: ImmutableArray[T]) : ImmutableArray[T]
  def fromArray(arr: Array[T]): ImmutableArray[T]

  def getIndex(index: Int): T

  def indexOf(element: T): Int

  def contains(element: T): Boolean

  def length: Int

  def apply(i: Int): T

  def set(index: Int, element: T): ImmutableArray[T]

  def remove(index: Int): ImmutableArray[T]

  def distinct: ImmutableArray[T]

}
