package io.venuu.toolbox.time

/**
  * Created by chris on 25/07/2016.
  */
object TimeIt {

  def timeIt[R](block: => R)(implicit timeProvider: Clock): (Long, R) = {

    val start = timeProvider.now()

    val r = block

    val end = timeProvider.now()

    (end - start, r)
  }

}
