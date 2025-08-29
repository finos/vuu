package org.finos.toolbox.collection.array

import scala.reflect.ClassTag

class NaiveImmutableArray[T <: Object :ClassTag](val array: Array[T] = Array.empty) extends ImmutableArray[T]{

  override def fromArray(arr: Array[T]): ImmutableArray[T] = {
    new NaiveImmutableArray[T](array = arr)
  }

  override def remove(element: T): ImmutableArray[T] = this.-(element)
  override def addAll(arr: ImmutableArray[T]): ImmutableArray[T] = this.++(arr)

  override def ++(arr: ImmutableArray[T]): ImmutableArray[T] = {
    new NaiveImmutableArray[T](array = Array.concat(this.array, arr.toArray ))
  }

  override def iterator: Iterator[T] = array.iterator

  override def distinct: ImmutableArray[T] = {
    ImmutableArray.from(this.array.distinct)
  }

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case value: NaiveImmutableArray[_] =>
        val toCheck = value.array
        val isEq = toCheck == array
        isEq
      case _ =>
        false
    }
  }

  override def apply(i: Int): T = array(i)

  override def + (element: T) : ImmutableArray[T] = new NaiveImmutableArray[T](array = array ++ Array(element) )

  override def indexOf(element: T): Int = array.indexOf(element)

  override def getIndex(index: Int): T = array(index)

  override def -(element: T) : ImmutableArray[T] = {
    new NaiveImmutableArray[T]( array = array.filterNot(e => e == element) )
  }

  override def length: Int = array.length

  override def set(index: Int, element: T): ImmutableArray[T] = {
    val previous = array.slice(0, index)
    val after = array.slice(index + 1, this.length)
    new NaiveImmutableArray[T](previous ++ Array(element) ++ after)
  }

  override def remove(index: Int): ImmutableArray[T] = {
    val previous = array.slice(0, index)
    val after = array.slice(index + 1, this.length)
    new NaiveImmutableArray[T](previous ++ after)
  }

  override def toString: String = "ImmutableArray(" + array.take(5).mkString(",") + "...)"
}
