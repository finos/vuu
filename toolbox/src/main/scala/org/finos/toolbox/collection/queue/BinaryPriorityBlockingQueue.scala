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

  private final val overflowQueue = new util.ArrayDeque[T]()
  private final val mainQueue = new util.ArrayDeque[T](capacity)
  private final val running = AtomicBoolean(true)
  private final val lock = ReentrantLock()
  private final val notEmpty = lock.newCondition()
  private final val notFull = lock.newCondition()

  override def put(e: T): Unit = {
    lock.lockInterruptibly()
    try {
      if (!running.get()) throw new IllegalStateException("Queue is shut down")
      while (running.get() && mainQueue.size() >= capacity) {
        logger.debug(s"Waiting for space to insert item $e")
        notFull.await()
      }
      if (running.get()) {
        mainQueue.addLast(e)
        notEmpty.signal()
      }
    } finally {
      lock.unlock()
    }
  }

  override def putHighPriority(e: T): Unit = {
    lock.lock()
    try {
      if (!running.get()) throw IllegalStateException("Queue is shut down")
      if (mainQueue.size() >= capacity) {
        val displaced = mainQueue.removeFirst()
        overflowQueue.addLast(displaced)
        logger.trace(s"Main full, moved $displaced to overflow")
      }
      mainQueue.addLast(e)
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
        if (nanos <= 0L) {
          logger.trace(s"No items available after ${timeout.toMillis}ms")
          return None
        }
        nanos = notEmpty.awaitNanos(nanos)
      }
      if (running.get()) {
        if (!overflowQueue.isEmpty) {
          Option(overflowQueue.removeFirst())
        } else if (!mainQueue.isEmpty) {
          val item = mainQueue.removeFirst()
          notFull.signal()
          Option(item)
        } else {
          None
        }
      } else {
        None
      }
    } finally {
      lock.unlock()
    }
  }

  override def drainTo(c: util.Collection[_ >: T]): Int = {
    lock.lock()
    try {
      var count = 0

      while (!overflowQueue.isEmpty) {
        c.add(overflowQueue.removeFirst())
        count += 1
      }

      val originalMainSize = mainQueue.size()
      while (!mainQueue.isEmpty) {
        c.add(mainQueue.removeFirst())
        count += 1
      }

      if (mainQueue.size() < originalMainSize) {
        notFull.signalAll()
      }

      logger.trace(s"Drained $count items")
      count
    } finally {
      lock.unlock()
    }
  }

  override def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int = {
    lock.lock()
    try {
      var count = 0

      while (!overflowQueue.isEmpty && count < maxElements) {
        c.add(overflowQueue.removeFirst())
        count += 1
      }

      val originalMainSize = mainQueue.size()
      while (!mainQueue.isEmpty && count < maxElements) {
        c.add(mainQueue.removeFirst())
        count += 1
      }

      if (mainQueue.size() < originalMainSize) {
        notFull.signalAll()
      }

      logger.trace(s"Drained $count items")
      count
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