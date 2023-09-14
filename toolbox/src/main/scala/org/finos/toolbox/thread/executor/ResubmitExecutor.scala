package org.finos.toolbox.thread.executor

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.NamedThreadFactory
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.thread.WorkItem
import org.finos.toolbox.time.Clock

import java.util
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.{BlockingQueue, Callable, FutureTask, RunnableFuture, ThreadPoolExecutor}
import scala.concurrent.duration.TimeUnit

/**
 * This is a java executor implementation, which will automatically resubmit the existing job into the queue
 * when its complete.
 *
 */
abstract class ResubmitExecutor[T](name: String, corePoolSize: Int, maxPoolSize: Int, keepAliveTime: Long, timeUnit: TimeUnit,
                       workQueue: BlockingQueue[Runnable])(implicit clock: Clock) extends ThreadPoolExecutor(corePoolSize, maxPoolSize, keepAliveTime, timeUnit, workQueue, new NamedThreadFactory(name)) with StrictLogging {

  private val logEvery = new LogAtFrequency(5_000)
  private val shuttingDown = new AtomicBoolean(false)

  override def shutdown(): Unit = {
    shuttingDown.set(true)
    super.shutdown()
  }

  override def shutdownNow(): util.List[Runnable] = {
    shuttingDown.set(true)
    super.shutdownNow()
  }

  override def afterExecute(r: Runnable, t: Throwable): Unit = {
    super.afterExecute(r, t)

    if(!shuttingDown.get()){
      val futureTask = r.asInstanceOf[FutureTask[T]]
      if(shouldResubmit(futureTask, t)){
        retry(futureTask, t)
        if(logEvery.shouldLog()){
          logger.info("Finished runnable:" + futureTask.get() + " resubmitting...")
        }
      }

    }
  }

  def retry(runnable: FutureTask[T], t: Throwable): Unit ={
    this.submit(newCallable(runnable, t))
  }

  def newCallable(r: FutureTask[T], t: Throwable): Callable[T]
  def shouldResubmit(r: FutureTask[T], t: Throwable): Boolean
  def newWorkItem(r: FutureTask[T]): WorkItem[T]
}
