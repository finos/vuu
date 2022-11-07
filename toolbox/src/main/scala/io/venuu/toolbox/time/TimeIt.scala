package io.venuu.toolbox.time


object TimeIt {

  def timeIt[R](block: => R)(implicit clock: Clock): (Long, R) = {

    val start = clock.now()

    val r = block

    val end = clock.now()

    (end - start, r)
  }

}
