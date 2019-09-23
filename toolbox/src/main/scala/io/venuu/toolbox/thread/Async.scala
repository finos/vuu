package io.venuu.toolbox.thread

/**
 * Created by chris on 26/10/2015.
 */
object Async {

  def waitTill(func: () => Boolean, maxTries: Int = 20, sleep: Long = 100): Unit = {

    var tries = 0
    var success = false

    while(tries < maxTries){
      success = func()
      Thread.sleep(sleep)
      tries += 1
    }

    if(tries == maxTries && !success)
      throw new Exception("Tried too long without success, throwing exception")

  }
}
