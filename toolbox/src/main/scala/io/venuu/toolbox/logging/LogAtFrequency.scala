/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 11/12/2015.

  */
package io.venuu.toolbox.logging

import io.venuu.toolbox.time.TimeProvider

class LogAtFrequency(millis: Long)(implicit val timeProvider: TimeProvider) {

  @volatile private var lastLog: Long = -1

  def shouldLog(): Boolean = {

    val now = timeProvider.now()

    val diff = now - lastLog

    val shouldLog = if(diff > millis) {
      lastLog = now
      true
    } else
      false

    shouldLog
  }

}
