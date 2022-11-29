package org.finos.toolbox.thread

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.thread.executor.ResubmitExecutor
import org.finos.toolbox.time.Clock

import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.{Callable, ConcurrentSkipListSet, FutureTask, LinkedBlockingQueue, TimeUnit}
import scala.jdk.CollectionConverters.CollectionHasAsScala

trait WorkItem[T] extends Comparable[WorkItem[T]]{
  def doWork(): T
  def compareTo(o: WorkItem[T]): Int = {
    if(o.hashCode() == this.hashCode()){
      0
    }else if( o.hashCode() < this.hashCode()){
      1
    }else if(o.hashCode() > this.hashCode()){
      -1
    }else{
      0
    }
  }
}

abstract class LifeCycleRunOncePerThreadExecutorRunner[T](val name: String, val countOfThreads: Int, val generateWorkFunc: () => List[WorkItem[T]]) (implicit lifecycle: LifecycleContainer, clock: Clock) extends LifeCycleRunner(name, () => ()) with StrictLogging{

  lifecycle(this)

  private var retryExecutor: Option[ResubmitExecutor[T]] = None
  private final val workQueue = new LinkedBlockingQueue[Runnable]()
  private val selfRef = this;
  private final val setOfWork = new ConcurrentSkipListSet[WorkItem[T]]()

  override def doStart(): Unit = {
    logger.info("Starting up viewport runner...")
    retryExecutor = Some(new ResubmitExecutor[T](countOfThreads, countOfThreads, 1000, TimeUnit.SECONDS, workQueue){
      override def newCallable(r: FutureTask[T], t: Throwable): Callable[T] = {
        selfRef.newCallable(r)
      }
      override def shouldResubmit(r: FutureTask[T], t: Throwable): Boolean = {
        setOfWork.contains(newWorkItem(r))
      }
      override def newWorkItem(r: FutureTask[T]): WorkItem[T] = selfRef.newWorkItem(r)
    })
    runInBackground()
  }

  override protected def getRunnable() = {
    () => {

        while (true) {
          val start = clock.now()

          val workList = generateWorkFunc()
          val addedWork = workList.filter(!setOfWork.contains(_))
          val removedWork = CollectionHasAsScala(setOfWork).asScala.filter(item => !workList.contains(item))

          removedWork.foreach( item => {
            setOfWork.remove(item)
            logger.info("Removed work item from viewport threadpool:" + item)
          })

          addedWork.foreach(item => {
            //println("Adding" + item.hashCode())
            setOfWork.add(item)
          })

          retryExecutor match {
            case Some(executor) => {
              addedWork.foreach(work => {
                executor.submit(new Callable[T] {
                  override def call(): T = {
                    logger.info("Adding work to vp threadpool.." + work)
                    work.doWork()
                  }
                })
              })
            }
            case None =>
          }

          val end = clock.now()

          doMinCycleTime(start, end)
          if (Thread.interrupted()) {
            //shouldContinue.set(false)
            logger.debug(s"[$name] interrupted or run once, going to exit")
          }
      }
    }
  }

  def newCallable(r: FutureTask[T]): Callable[T]
  def newWorkItem(r: FutureTask[T]): WorkItem[T]

  override def doStop(): Unit = {
    retryExecutor match {
      case Some(executor) => {
        executor.shutdown()
      }
      case None => //all good
    }
    logger.info(s"[$name] is exiting....")
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = this.getClass.getName + "#" + this.hashCode()
}
