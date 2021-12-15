package io.venuu.toolbox

import scala.collection.mutable

trait CoalescingQueue[VALUE <: AnyRef, KEY]{
  def push(item: VALUE)
  def isEmpty(): Boolean
  def popUpTo(i: Int): Seq[VALUE]
  def pop(): VALUE
  def popOption(): Option[VALUE]
  def length: Int
}

class CoalescingQueueNaiveImpl[VALUE <: AnyRef, KEY](fn: VALUE => KEY, merge: (VALUE,VALUE) => VALUE) extends CoalescingQueue[VALUE, KEY] {

  private val keysInOrder = new mutable.Queue[KEY]
  private val values = new java.util.HashMap[KEY, VALUE]()
  private val lock = new Object

  def length: Int  = keysInOrder.size

  def push(item: VALUE) = {
    lock.synchronized{
      enqueue(fn(item), item)
    }
  }

  protected def enqueue(key: KEY, value: VALUE) = {
    lock.synchronized{
    values.get(key) match {
      case null =>
        keysInOrder.enqueue(key)
        values.put(key, value)

      case old =>

        val merged = merge(old, value)

        if(merged ne old ){
          values.put(key, merged)
        }

    }
    }
  }

  def isEmpty() = lock.synchronized{
    values.isEmpty
  }

  protected def dequeue : VALUE = {
     lock.synchronized{
       val key = keysInOrder.dequeue()
       values.remove(key)
     }
  }


  def popUpTo(i: Int): Seq[VALUE] = {
    lock.synchronized{
      val entries = for(i <- 0 to (i - 1) if(keysInOrder.size > 0) ) yield keysInOrder.dequeue()
      entries.map(values.remove(_))
      }
  }

  def pop(): VALUE = dequeue

  def popOption(): Option[VALUE] = {
   val v = dequeue

    if(v == null) None
    else Some(v)
  }

}
