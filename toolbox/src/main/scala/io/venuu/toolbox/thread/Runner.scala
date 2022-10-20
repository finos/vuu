package io.venuu.toolbox.thread

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.NamedThreadFactory
import io.venuu.toolbox.time.Clock

import java.util.concurrent.atomic.AtomicBoolean
import scala.util.control.NonFatal

class Runner(name: String, func: () => Unit, minCycleTime: Long = 1000, runOnce: Boolean = false)(implicit clock: Clock) extends StrictLogging {

  private val thread = new NamedThreadFactory(name).newThread(getRunnable)

  private val shouldContinue = new AtomicBoolean(true)

  private def doMinCycleTime(start: Long, end: Long): Unit = {
    val takenMillis = end - start
    if(takenMillis < minCycleTime){

      val sleep = minCycleTime - takenMillis
      clock.sleep(sleep)
    }

  }

  def runInBackground() = {
    thread.start()
  }

  def interrupt() = thread.interrupt()

  def join() = thread.join()

  def run() = ???

  def stop() = {
    shouldContinue.set(false)
    thread.interrupt()
  }

  protected def getRunnable = {
    new Runnable {
      override def run(): Unit = {
        try{
          while(shouldContinue.get()){
            val start = clock.now()
            func()
            val end = clock.now()
            doMinCycleTime(start, end)
            if(Thread.interrupted() || runOnce == true ){
              shouldContinue.set(false)
              logger.debug(s"[$name] interrupted or run once, going to exit")
            }
          }

        }catch{
          case int: java.lang.InterruptedException => logger.debug(s"[$name] interrupted, going to exit")
          case NonFatal(e) => logger.error(s"[$name] threw an exception in run", e)
        }

        logger.info(s"[$name] is exiting")
      }
    }
  }

}
