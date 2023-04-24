package org.finos.toolbox.collection.array

import org.finos.toolbox.collection.set.ChunkedUniqueImmutableArraySet
import scala.reflect.ClassTag

object ImmutableArray{
  def empty[T](implicit c: ClassTag[T]): ImmutableArray[T] = {
    new ChunkedUniqueImmutableArraySet[T](Set(), Array(), chunkSize = 5000)
  }
  def from[T](array: Array[T])(implicit c: ClassTag[T]): ImmutableArray[T] = {
    empty[T].addAll(new NaiveImmutableArray[T](array))
  }
}

object ImmutableArrays{
  def empty[T :ClassTag](i: Int): Array[ImmutableArray[T]] = {
    (0 to (i - 1)).map( i=> new NaiveImmutableArray[T](Array[T]())).toArray
  }
}

trait ImmutableArray[T] extends Iterable[T] {
  //
  def +(element: T) : ImmutableArray[T]

  def -(element: T): ImmutableArray[T]
  def remove(element: T): ImmutableArray[T]

  def ++(arr: ImmutableArray[T]) : ImmutableArray[T]
  def addAll(arr: ImmutableArray[T]) : ImmutableArray[T]

  def getIndex(index: Int): T

  def indexOf(element: T): Int

  def length: Int

  def apply(i: Int): T

  def set(index: Int, element: T): ImmutableArray[T]

  def remove(index: Int): ImmutableArray[T]

  def distinct: ImmutableArray[T]

}
