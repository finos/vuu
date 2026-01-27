package org.finos.toolbox.collection.queue

import java.util
import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue, LinkedBlockingQueue}
import scala.reflect.ClassTag

trait PriorityBlockingQueue[T] {
  def put(e: T): Unit
  def putHighPriority(e: T): Unit
  def drainTo(c: util.Collection[_ >: T]): Int
  def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int
}

object PriorityBlockingQueue {

  def apply[T <: Object :ClassTag](): PriorityBlockingQueue[T] = new PriorityBlockingQueueImpl(Int.MaxValue)

  def apply[T <: Object :ClassTag](capacity: Int): PriorityBlockingQueue[T] = new PriorityBlockingQueueImpl[T](capacity)

}

class PriorityBlockingQueueImpl[T](capacity: Int) extends PriorityBlockingQueue[T] {

  private final val priorityQueue: BlockingQueue[T] = new LinkedBlockingQueue[T]()
  private final val queue: BlockingQueue[T] = new ArrayBlockingQueue[T](capacity)

  override def put(e: T): Unit = {
    queue.put(e)
  }

  override def putHighPriority(e: T): Unit = {
    priorityQueue.put(e)
  }

  override def drainTo(c: util.Collection[_ >: T]): Int = {
    priorityQueue.drainTo(c) + queue.drainTo(c)
  }

  override def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int = {
    val priorityCount = priorityQueue.drainTo(c, maxElements)
    val remaining = maxElements - priorityCount
    val normalCount = if (remaining > 0) queue.drainTo(c, remaining) else 0
    priorityCount + normalCount
  }

}