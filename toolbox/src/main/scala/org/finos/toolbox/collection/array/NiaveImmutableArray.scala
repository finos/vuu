package org.finos.toolbox.collection.array

import scala.reflect.ClassTag



class NiaiveImmutableArray[T :ClassTag](val array: Array[T] = Array.empty) extends ImmutableArray[T]{

  override def remove(element: T): ImmutableArray[T] = this.-(element)
  override def addAll(arr: ImmutableArray[T]): ImmutableArray[T] = this.++(arr)

  override def ++(arr: ImmutableArray[T]): ImmutableArray[T] = {
    new NiaiveImmutableArray[T](array = Array.concat(this.array, arr.toArray ))
  }

  override def iterator: Iterator[T] = array.iterator

  override def distinct: ImmutableArray[T] = {
    ImmutableArray.from(this.array.distinct)
  }

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case value: NiaiveImmutableArray[_] =>
        val toCheck = value.array
        val isEq = toCheck == array
        isEq
      case _ =>
        false
    }
  }

  override def apply(i: Int): T = array(i)

  override def + (element: T) : ImmutableArray[T] = new NiaiveImmutableArray[T](array = array ++ Array(element) )

  override def indexOf(element: T): Int = array.indexOf(element)

  override def getIndex(index: Int): T = array(index)

  override def -(element: T) : ImmutableArray[T] = {
    new NiaiveImmutableArray[T]( array = array.filterNot( e => e == element) )
  }

  override def length: Int = array.length

  override def set(index: Int, element: T): ImmutableArray[T] = {
    val previous = array.slice(0, index)
    val after = array.slice(index + 1, this.length - 1)
    new NiaiveImmutableArray[T](previous ++ Array(element) ++ after)
  }

  override def remove(index: Int): ImmutableArray[T] = {
    val previous = array.slice(0, index)
    val after = array.slice(index + 1, this.length)
    new NiaiveImmutableArray[T](previous ++ after)
  }

  override def toString: String = "ImmutableArray(" + array.take(5).mkString(",") + "...)"
}
