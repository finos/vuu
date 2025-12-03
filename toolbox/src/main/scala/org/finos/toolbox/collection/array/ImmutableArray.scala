package org.finos.toolbox.collection.array

import org.finos.toolbox.collection.set.ChunkedUniqueImmutableArraySet

import scala.reflect.ClassTag

object ImmutableArray {

  def empty[T <: Object](chunkSize: Int = 5000)(implicit c: ClassTag[T]): ImmutableArray[T] = {
    new ChunkedUniqueImmutableArraySet[T](Set.empty, Array.empty, chunkSize)
  }

  def from[T <: Object](array: Array[T])(implicit c: ClassTag[T]): ImmutableArray[T] = {
    empty[T](chunkSize(array.length)).addAll(new NaiveImmutableArray[T](array))
  }

  def fromArray[T <: Object](array: Array[T])(implicit c: ClassTag[T]): ImmutableArray[T] = {
    empty[T](chunkSize(array.length)).fromArray(array)
  }

  private def chunkSize(hint: Int): Int = {
    if(hint < 100_000){
        5000
    }else if(hint < 9000_000){
        50_000
    }else{
        100_000
    }
  }
}

object ImmutableArrays{
  def empty[T <: Object :ClassTag](i: Int): Array[ImmutableArray[T]] = {
    (0 to (i - 1)).map( i=> new NaiveImmutableArray(Array[T]())).toArray
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

  def length: Int

  def apply(i: Int): T

  def set(index: Int, element: T): ImmutableArray[T]

  def remove(index: Int): ImmutableArray[T]

  def distinct: ImmutableArray[T]

}
