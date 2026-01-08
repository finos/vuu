package org.finos.toolbox.collection.set

import org.finos.toolbox.collection.array.ImmutableArray

import scala.reflect.ClassTag

trait ImmutableArraySet[T] extends ImmutableArray[T] {

  override def +(element: T): ImmutableArraySet[T]

  override def -(element: T): ImmutableArraySet[T]

  override def remove(element: T): ImmutableArraySet[T]

  override def ++(arr: ImmutableArray[T]): ImmutableArraySet[T]

  override def addAll(arr: ImmutableArray[T]): ImmutableArraySet[T]

  override def fromArray(arr: Array[T]): ImmutableArraySet[T]

  override def getIndex(index: Int): T

  override def indexOf(element: T): Int

  override def contains(element: T): Boolean

  override def length: Int

  override def apply(i: Int): T

  override def set(index: Int, element: T): ImmutableArraySet[T]

  override def remove(index: Int): ImmutableArraySet[T]

  override def distinct: ImmutableArraySet[T]

}

object ImmutableArraySet {

  def empty[T <: Object](implicit c: ClassTag[T]): ImmutableArraySet[T] = {
    ChunkedImmutableArraySet.empty()
  }

  def from[T <: Object](array: Array[T])(implicit c: ClassTag[T]): ImmutableArraySet[T] = {
    ChunkedImmutableArraySet.from(array)
  }

}
