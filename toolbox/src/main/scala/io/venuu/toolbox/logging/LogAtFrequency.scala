package io.venuu.toolbox.logging

import io.venuu.toolbox.time.Clock

class LogAtFrequency(millis: Long)(implicit val timeProvider: Clock) {

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
