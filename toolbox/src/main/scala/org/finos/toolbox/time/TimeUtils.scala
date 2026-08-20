package org.finos.toolbox.time

import java.time.{Duration, Instant}

object TimeUtils {

  private val NANOS_PER_SECOND = Duration.ofSeconds(1).toNanos

  def ofEpochNanosecond(epochNanosecond: Long): Instant = {
    val seconds = epochNanosecond / NANOS_PER_SECOND
    val nanos = epochNanosecond % NANOS_PER_SECOND
    Instant.ofEpochSecond(seconds, nanos)
  }

}
