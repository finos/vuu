package org.finos.toolbox.collection.queue

import java.util
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock
import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue, LinkedBlockingQueue}
import scala.concurrent.duration.Duration
import scala.reflect.ClassTag

trait BinaryPriorityBlockingQueue[T] {
  def put(e: T): Unit
  def putHighPriority(e: T): Unit
  def poll(timeout: Duration = Duration.Zero): Option[T]
  def drainTo(c: util.Collection[_ >: T]): Int
  def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int
  def shutdown(): Unit
}

object BinaryPriorityBlockingQueue {

  def apply[T <: Object :ClassTag](capacity: Int): BinaryPriorityBlockingQueue[T] = BinaryPriorityBlockingQueueImpl[T](capacity)

}

private class BinaryPriorityBlockingQueueImpl[T](capacity: Int) extends BinaryPriorityBlockingQueue[T] {

  private final val priorityQueue: BlockingQueue[T] = LinkedBlockingQueue[T]()
  private final val queue: BlockingQueue[T] = ArrayBlockingQueue[T](capacity)
  private final val running = AtomicBoolean(true)
  private final val lock = ReentrantLock()
  private final val notEmpty = lock.newCondition()

  override def put(e: T): Unit = {
    if (!running.get()) throw IllegalStateException("Queue is shut down")
    queue.put(e)
    signal()
  }

  override def putHighPriority(e: T): Unit = {
    if (!running.get()) throw IllegalStateException("Queue is shut down")
    priorityQueue.put(e)
    signal()
  }

  override def poll(timeout: Duration): Option[T] = {
    var nanos = timeout.toNanos
    lock.lockInterruptibly()
    try {
      while (running.get() && priorityQueue.isEmpty && queue.isEmpty) {
        if (nanos <= 0L) return None
        nanos = notEmpty.awaitNanos(nanos)
      }
      val item = priorityQueue.poll()
      if (item != null) {
        Option(item)
      } else {
        Option(queue.poll())
      }
    } finally {
      lock.unlock()
    }
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

  override def shutdown(): Unit = {
    lock.lock()
    try {
      running.set(false)
      notEmpty.signalAll()
    } finally {
      lock.unlock()
    }
  }

  private def signal(): Unit = {
    lock.lock()
    try {
      notEmpty.signal()
    } finally {
      lock.unlock()
    }
  }

}