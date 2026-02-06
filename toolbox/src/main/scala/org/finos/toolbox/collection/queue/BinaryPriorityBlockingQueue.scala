package org.finos.toolbox.collection.queue

import com.typesafe.scalalogging.StrictLogging

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

private class BinaryPriorityBlockingQueueImpl[T](capacity: Int) extends BinaryPriorityBlockingQueue[T] with StrictLogging {

  private final val overflowQueue: BlockingQueue[T] = LinkedBlockingQueue[T]()
  private final val mainQueue: BlockingQueue[T] = ArrayBlockingQueue[T](capacity)
  private final val running = AtomicBoolean(true)
  private final val lock = ReentrantLock()
  private final val notEmpty = lock.newCondition()
  private final val notFull = lock.newCondition()

  override def put(e: T): Unit = {
    if (!running.get()) throw IllegalStateException("Queue is shut down")
    lock.lockInterruptibly()
    try {
      while (running.get() && mainQueue.remainingCapacity() == 0) {
        logger.debug(s"Waiting for space to insert item $e")
        notFull.await()
      }
      if (mainQueue.offer(e)) {
        notEmpty.signal()
      } else {
        logger.error(s"Failed to put item $e")
      }
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
          logger.trace(s"Main queue is full, moving item $displaced to overflow")
          overflowQueue.put(displaced)
        }
      }
      if (mainQueue.offer(e)) {
        notEmpty.signal()
      } else {
        logger.error(s"Failed to put high priority item $e")
      }
    } finally {
      lock.unlock()
    }
  }

  override def poll(timeout: Duration): Option[T] = {
    var nanos = timeout.toNanos
    lock.lockInterruptibly()
    try {
      while (running.get() && overflowQueue.isEmpty && mainQueue.isEmpty) {
        if (nanos <= 0L) {
          logger.trace(s"No items available after ${timeout.toMillis}ms")
          return None
        }
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
      logger.trace(s"Drained $count items")
      count
    } finally {
      lock.unlock()
    }
  }

  override def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int = {
    lock.lock()
    try {
      val overflowCount = overflowQueue.drainTo(c, maxElements)
      val remaining = maxElements - overflowCount
      val normalCount = if (remaining > 0) mainQueue.drainTo(c, remaining) else 0
      if (normalCount > 0) {
        notFull.signal()
      }
      logger.trace(s"Drained $overflowCount overflow items and $normalCount normal items")
      overflowCount + normalCount
    } finally {
      lock.unlock()
    }
  }

  override def shutdown(): Unit = {
    lock.lock()
    try {
      logger.trace("Shutting down")
      running.set(false)
      notEmpty.signalAll()
      notFull.signalAll()
      logger.debug("Shut down")
    } finally {
      lock.unlock()
    }
  }

}