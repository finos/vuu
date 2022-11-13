package org.finos.toolbox.time

trait Clock{
  def now(): Long
  def sleep(millis: Long): Unit
}

class DefaultClock extends Clock {
  override def now(): Long = System.currentTimeMillis()
  override def sleep(millis: Long): Unit = Thread.sleep(millis)
}
