package org.finos.toolbox.thread

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
