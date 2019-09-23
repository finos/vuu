/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.toolbox.time

trait TimeProvider{
  def now(): Long
  def sleep(millis: Long): Unit
}

class DefaultTimeProvider extends TimeProvider {
  override def now(): Long = System.currentTimeMillis()
  override def sleep(millis: Long): Unit = Thread.sleep(millis)
}
