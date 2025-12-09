package org.finos.toolbox.time

object TimeIt {

  def timeIt[R](block: => R): (Long, R) = {

    val start = System.currentTimeMillis()

    val r = block

    val timeinMillis = System.currentTimeMillis() - start

    (timeinMillis, r)
  }

  def timeItThen[R](block: => R, thenBlock: (Long, R) => Unit): R = {

    val start = System.currentTimeMillis()

    val r = block

    val timeinMillis = System.currentTimeMillis() - start

    thenBlock(timeinMillis, r)

    r
  }

}
