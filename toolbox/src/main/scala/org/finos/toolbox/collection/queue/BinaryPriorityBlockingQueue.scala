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

  private final val overflowQueue: BlockingQueue[T] = LinkedBlockingQueue[T]()
  private final val mainQueue: BlockingQueue[T] = ArrayBlockingQueue[T](capacity)
  private final val running = AtomicBoolean(true)
  private final val lock = ReentrantLock()
  private final val notEmpty = lock.newCondition()
  private final val notFull = lock.newCondition()

  override def put(e: T): Unit = {
    if (!running.get()) throw IllegalStateException("Queue is shut down")
    lock.lock()
    try {
      while (mainQueue.remainingCapacity() == 0) {
        notFull.await()
      }
      mainQueue.offer(e)
      notEmpty.signal()
    } finally {
      lock.unlock()
    }
  }

  override def putHighPriority(e: T): Unit = {
    if (!running.get()) throw IllegalStateException("Queue is shut down")
    lock.lock()
    try {
      if (mainQueue.remainingCapacity() == 0) {
        val displaced = mainQueue.poll()
        if (displaced != null) {
          overflowQueue.put(displaced)
        }
      }
      mainQueue.offer(e)
      notEmpty.signal()
    } finally {
      lock.unlock()
    }
  }

  override def poll(timeout: Duration): Option[T] = {
    var nanos = timeout.toNanos
    lock.lockInterruptibly()
    try {
      while (running.get() && overflowQueue.isEmpty && mainQueue.isEmpty) {
        if (nanos <= 0L) return None
        nanos = notEmpty.awaitNanos(nanos)
      }
      val overflowItem = overflowQueue.poll()
      if (overflowItem != null) {
        Option(overflowItem)
      } else {
        val mainItem = mainQueue.poll()
        notFull.signal()
        Option(mainItem)
      }
    } finally {
      lock.unlock()
    }
  }

  override def drainTo(c: util.Collection[_ >: T]): Int = {
    lock.lock()
    try {
      val count = overflowQueue.drainTo(c) + mainQueue.drainTo(c)
      notFull.signal()
      count
    } finally {
      lock.unlock()
    }
  }

  override def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int = {
    lock.lock()
    try {
      val priorityCount = overflowQueue.drainTo(c, maxElements)
      val remaining = maxElements - priorityCount
      val normalCount = if (remaining > 0) mainQueue.drainTo(c, remaining) else 0
      if (normalCount > 0) {
        notFull.signal()
      }
      priorityCount + normalCount
    } finally {
      lock.unlock()
    }
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