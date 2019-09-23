package io.venuu.toolbox.time

/**
  * Created by chris on 22/12/2015.
  */
class TestFriendlyTimeProvider(start: Long) extends TimeProvider{

  @volatile private var currentTime = start

  def advanceBy(m: Long) = {
    currentTime += m
  }

  override def now(): Long = currentTime

  override def sleep(millis: Long): Unit = {currentTime += millis}
}
