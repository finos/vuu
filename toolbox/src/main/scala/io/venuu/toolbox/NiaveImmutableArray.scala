/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 12/02/15.

 */
package io.venuu.toolbox

import scala.reflect.ClassTag

object ImmutableArray{
  def empty[T](implicit c: ClassTag[T]): ImmutableArray[T] = new NiaiveImmutableArray(Array[T]())
  def from[T](array: Array[T])(implicit c: ClassTag[T]) = new NiaiveImmutableArray[T](array)
}

object ImmutableArrays{
  def empty[T :ClassTag](i: Int): Array[ImmutableArray[T]] = {
    (0 to (i - 1)).map( i=> new NiaiveImmutableArray[T](Array[T]())).toArray
  }
}

trait ImmutableArray[T] {
  //
  def +(element: T) : ImmutableArray[T]

  def -(element: T): ImmutableArray[T]

  def ++(arr: ImmutableArray[T]) : ImmutableArray[T]

  def toArray: Array[T]

  def toList: List[T]

  def getIndex(index: Int): T

  def indexOf(element: T): Int

  def length: Int

  def apply(i: Int): T

  def set(index: Int, element: T): ImmutableArray[T]

  def remove(index: Int): ImmutableArray[T]

  def distinct: ImmutableArray[T]
}

class NiaiveImmutableArray[T :ClassTag](val array: Array[T] = Array.empty) extends ImmutableArray[T]{

  override def ++(arr: ImmutableArray[T]): ImmutableArray[T] = {
    new NiaiveImmutableArray[T](array = Array.concat(this.array, arr.toArray ))
  }

  override def distinct: ImmutableArray[T] = {
    ImmutableArray.from(this.array.distinct)
  }

  override def equals(obj: scala.Any): Boolean = {
    if(obj.isInstanceOf[NiaiveImmutableArray[T]]){

      val toCheck = obj.asInstanceOf[NiaiveImmutableArray[T]].array

      val isEq = toCheck.deep == array.deep

      isEq

    } else{
      false
    }
  }

  override def apply(i: Int): T = array(i)

  override def + (element: T) : ImmutableArray[T] = new NiaiveImmutableArray[T](array = array ++ Array(element) )

  override def indexOf(element: T): Int = array.indexOf(element)

  override def getIndex(index: Int): T = array(index)

  override def toArray: Array[T] = array

  override def toList: List[T] = array.toList

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

  override def toString: String = "ImmutableArray(" + array.mkString(",") + ")"
}
