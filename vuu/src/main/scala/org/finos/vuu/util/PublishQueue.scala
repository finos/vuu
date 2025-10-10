package org.finos.vuu.util

import org.finos.toolbox.CoalescingPriorityQueueImpl
import org.finos.vuu.viewport.{ViewPortUpdate, ViewPortUpdateType}

trait PublishQueue[T] {

  def push(entry: T): Unit

  def pushHighPriority(entry: T): Unit

  def pop: T

  def popUpTo(i: Int): Seq[T]

  def isEmpty: Boolean

  def length: Int
}

class OutboundRowPublishQueue extends PublishQueue[ViewPortUpdate] {

  private case class CollKey(id: String, updateType: ViewPortUpdateType, rowKey: String)

  private def mergeFn(vpOld: ViewPortUpdate, vpNew: ViewPortUpdate) = vpNew

  private def toKeyFunc(vpu: ViewPortUpdate) = CollKey(vpu.vp.id, vpu.vpUpdate, vpu.key.key)

  private def compareEq(k1: CollKey, k2: CollKey): Int = {
    k1.rowKey.compareTo(k2.rowKey)
  }

  private val coallescingQ = new CoalescingPriorityQueueImpl[ViewPortUpdate, CollKey](toKeyFunc, mergeFn, compareEq)

  override def push(entry: ViewPortUpdate): Unit = {
    coallescingQ.push(entry)
  }

  override def pushHighPriority(entry: ViewPortUpdate): Unit = {
    coallescingQ.pushHighPriority(entry)
  }

  override def popUpTo(i: Int): Seq[ViewPortUpdate] = coallescingQ.popUpTo(i)

  override def isEmpty: Boolean = coallescingQ.isEmpty()

  override def pop: ViewPortUpdate = coallescingQ.pop()

  override def length: Int = coallescingQ.length


}

