/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 27/03/15.

 */
package io.venuu.vuu.util

import io.venuu.toolbox.CoalescingQueue
import io.venuu.vuu.viewport.{ViewPortUpdate, ViewPortUpdateType}

trait PublishQueue[T] {

  def push(entry: T)
  def pop: T
  def popUpTo(i: Int): Seq[T]
  def isEmpty: Boolean
  def length: Int
}

class OutboundRowPublishQueue extends PublishQueue[ViewPortUpdate]{

  private case class CollKey(id: String, updateType: ViewPortUpdateType, rowKey: String)

  private def mergeFn(vpOld: ViewPortUpdate, vpNew: ViewPortUpdate) = vpNew

  private def toKeyFunc(vpu: ViewPortUpdate) = new CollKey(vpu.vp.id, vpu.vpUpdate, vpu.key.key)

  private val coallescingQ = new CoalescingQueue[ViewPortUpdate, CollKey](toKeyFunc, mergeFn)

  override def push(entry: ViewPortUpdate): Unit = coallescingQ.push(entry)

  override def popUpTo(i: Int): Seq[ViewPortUpdate] = coallescingQ.popUpTo(i)

  override def isEmpty: Boolean = coallescingQ.isEmpty

  override def pop: ViewPortUpdate = coallescingQ.pop()

  override def length: Int = coallescingQ.length


}

