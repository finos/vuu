package org.finos.toolbox.time

object TimeIt {

  def timeIt[R](block: => R)(implicit timeProvider: Clock): (Long, R) = {

    val start = timeProvider.now()

    val r = block

    val end = timeProvider.now()

    (end - start, r)
  }

  def timeItThen[R](block: => R, thenBlock: (Long, R) => Unit)(implicit timeProvider: Clock): R = {

    val start = timeProvider.now()

    val r = block

    val end = timeProvider.now()

    val timeinMillis = end - start

    thenBlock(timeinMillis, r)

    r
  }

}
