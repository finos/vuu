package org.finos.toolbox.logging

import org.finos.toolbox.time.Clock

class LogAtFrequency(millis: Long)(implicit val clock: Clock) {

  @volatile private var lastLog: Long = -1

  def shouldLog(): Boolean = {

    val now = clock.now()

    val diff = now - lastLog

    val shouldLog = if(diff > millis) {
      lastLog = now
      true
    } else
      false

    shouldLog
  }

}
