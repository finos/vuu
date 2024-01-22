package org.finos.toolbox

import java.util.PriorityQueue

class CoalescingPriorityQueueImpl[VALUE <: AnyRef, KEY](fn: VALUE => KEY, merge: (VALUE, VALUE) => VALUE, compareEqFun: (KEY, KEY) => Int) extends CoalescingQueue[VALUE, KEY] {

  private val keysInOrder = new PriorityQueue[PrioritizedItem[KEY]]((o1: PrioritizedItem[KEY], o2: PrioritizedItem[KEY]) => {
    if (o1.highPriority && !o2.highPriority) {
      -1
    } else if (!o1.highPriority && o2.highPriority) {
      1
    } else {
      compareEqFun(o1.KEY, o2.KEY)
    }
  })
  private val values = new java.util.HashMap[KEY, VALUE]()
  private val lock = new Object

  def length: Int = keysInOrder.size

  def push(item: VALUE) = {
    lock.synchronized {
      enqueue(fn(item), item, false)
    }
  }

  private def enqueue(key: KEY, value: VALUE, highPriority: Boolean) = {

    if(key != null && value != null){

    lock.synchronized {
      values.get(key) match {
        case null =>
          keysInOrder.add(PrioritizedItem(key, highPriority))
          values.put(key, value)
        case old =>
          val merged = merge(old, value)
          if (merged ne old) {
            values.put(key, merged)
          }
      }
    }
    }
  }

  override def pushHighPriority(item: VALUE): Unit = {
    lock.synchronized {
      enqueue(fn(item), item, true)
    }
  }

  def isEmpty() = lock.synchronized {
    values.isEmpty
  }

  def popUpTo(i: Int): Seq[VALUE] = {
    lock.synchronized {
      val entries = for (i <- 0 until i if keysInOrder.size > 0) yield keysInOrder.poll()
      entries.map(x => values.remove(x.KEY))
    }
  }

  def pop(): VALUE = dequeue

  def popOption(): Option[VALUE] = {
    val v = dequeue
    Option(v)
  }

   private def dequeue: VALUE = {
    lock.synchronized {
      val key = keysInOrder.poll()
      values.remove(key.KEY)
    }
  }

  case class PrioritizedItem[KEY](KEY: KEY, highPriority: Boolean)
}
