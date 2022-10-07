package io.venuu.toolbox.time


object TimeIt {

  def timeIt[R](block: => R)(implicit timeProvider: Clock): (Long, R) = {

    val start = timeProvider.now()

    val r = block

    val end = timeProvider.now()

    (end - start, r)
  }

}
