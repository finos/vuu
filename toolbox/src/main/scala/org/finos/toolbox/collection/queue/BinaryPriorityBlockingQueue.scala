package org.finos.toolbox.collection.queue

import java.util
import java.util.concurrent.locks.ReentrantLock
import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue, LinkedBlockingQueue}
import scala.reflect.ClassTag

trait BinaryPriorityBlockingQueue[T] {
  def put(e: T): Unit
  def putHighPriority(e: T): Unit
  def take(): Option[T]
  def drainTo(c: util.Collection[_ >: T]): Int
  def drainTo(c: util.Collection[_ >: T], maxElements: Int): Int
  def shutdown(): Unit
}

object BinaryPriorityBlockingQueue {

  def apply[T <: Object :ClassTag](capacity: Int): BinaryPriorityBlockingQueue[T] = new BinaryPriorityBlockingQueueImpl[T](capacity)

}

class BinaryPriorityBlockingQueueImpl[T](capacity: Int) extends BinaryPriorityBlockingQueue[T] {

  private final val priorityQueue: BlockingQueue[T] = new LinkedBlockingQueue[T]()
  private final val queue: BlockingQueue[T] = new ArrayBlockingQueue[T](capacity)
  private final val lock = new ReentrantLock()
  private final val notEmpty = lock.newCondition()
  @volatile private var running = true

  override def put(e: T): Unit = {
    if (!running) throw new IllegalStateException("Queue is shut down")
    queue.put(e)
    signal()
  }

  override def putHighPriority(e: T): Unit = {
    if (!running) throw new IllegalStateException("Queue is shut down")
    priorityQueue.put(e)
    signal()
  }

  override def take(): Option[T] = {
    lock.lockInterruptibly()
    try {
      while (running && priorityQueue.isEmpty && queue.isEmpty) {
        notEmpty.await()
      }
      Option(extract())
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
      running = false
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

  private def extract(): T = {
    val item = priorityQueue.poll()
    if (item != null) item else queue.poll()
  }

}