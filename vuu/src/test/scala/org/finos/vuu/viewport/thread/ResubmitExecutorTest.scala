package org.finos.vuu.viewport.thread

import org.finos.toolbox.thread.{Async, WorkItem}
import org.finos.toolbox.thread.executor.ResubmitExecutor
import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.featurespec.AnyFeatureSpec

import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.{Callable, FutureTask, LinkedBlockingQueue, TimeUnit}

/**
 * The Resubmit executor keeps submitting a list of jobs when they complete (if they are still) forever.
 * This is designed for processes like processing the viewport information, where we want to
 * distribute them over as many threads as possible in the most efficient way possible, but we never
 * want more than one thread, submitting the keys into the viewport. (i..e we never want a viewport to be calculated
 * by more than one thread in parallel.
 */
class ResubmitExecutorTest extends AnyFeatureSpec{

  case class TestCounter(name: String, counter: AtomicInteger = new AtomicInteger(0))

  Feature("test submission onto resubmit queue"){

    Scenario("Check we can add jobs, the get run on the threads, and then resubmitted on completion"){

      implicit val clock = new TestFriendlyClock(1407109860000L)

      val executor = new ResubmitExecutor[TestCounter]("treeSubmitExec", 3, 3, 1000, TimeUnit.SECONDS, new LinkedBlockingQueue[Runnable]()){

        override def shouldResubmit(r: FutureTask[TestCounter], t: Throwable): Boolean = {
          r.get().counter.get() < 10
        }

        override def newCallable(r: FutureTask[TestCounter], t: Throwable): Callable[TestCounter] = {
          () => {
            val testCounter = r.get()
            if (testCounter.counter.get() < 10) {
              println(s"T=${Thread.currentThread().getName}, Counter[${testCounter.name}]" + testCounter.counter.incrementAndGet())
            }
            testCounter
          }

        }

        override def newWorkItem(r: FutureTask[TestCounter]): WorkItem[TestCounter] = {
          () => {
            val testCounter = r.get()
            if (testCounter.counter.get() < 10) {
              println(s"T=${Thread.currentThread().getName}, Counter[${testCounter.name}]" + testCounter.counter.incrementAndGet())
            }
            testCounter
          }
        }
      }

      val counter1 = TestCounter("counter1")
      val counter2 = TestCounter("counter2")

      val callable1 = new Callable[TestCounter] {
        override def call(): TestCounter = {
          if(counter1.counter.get() < 10){
            println(s"Counter[${counter1.name}]" + counter1.counter.incrementAndGet())
          }
          counter1
        }
      }

      val callable2 = new Callable[TestCounter] {
        override def call(): TestCounter = {
          if(counter2.counter.get() < 10){
            println(s"Counter[${counter1.name}]" + counter1.counter.incrementAndGet())
          }
          counter2
        }
      }

      executor.submit(callable1)
      executor.submit(callable2)

      Async.waitTill( () => {
        counter1.counter.get() >= 10 && counter2.counter.get() >= 10
      }, 50, 5)

      executor.shutdown()
    }

  }


}
