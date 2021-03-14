/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.toolbox.thread

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.NamedThreadFactory
import io.venuu.toolbox.time.Clock

import java.util.concurrent.atomic.AtomicBoolean
import scala.util.control.NonFatal

/**
  * Runner is just a wrapper around thread currently, which some nicer error handling.
  */
class Runner(name: String, func: () => Unit, minCycleTime: Long = 1000, runOnce: Boolean = false)(implicit timeProvider: Clock) extends StrictLogging {

  private val thread = new NamedThreadFactory(name).newThread(getRunnable)

  private val shouldContinue = new AtomicBoolean(true)

  private def doMinCycleTime(start: Long, end: Long): Unit = {
    val takenMillis = end - start
    if(takenMillis < minCycleTime){

      val sleep = minCycleTime - takenMillis
      timeProvider.sleep(sleep)
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
            val start = timeProvider.now()
            func()
            val end = timeProvider.now()
            doMinCycleTime(start, end)
            if(Thread.interrupted() || runOnce == true ){
              shouldContinue.set(false)
              logger.info(s"[$name] interrupted or rune once, going to exit")
            }
          }

        }catch{
          case int: java.lang.InterruptedException => logger.info(s"[$name] interrupted, going to exit")
          case NonFatal(e) => logger.error(s"[$name] threw an exception in run", e)
        }

        logger.info(s"[$name] is exiting")
      }
    }
  }

}
