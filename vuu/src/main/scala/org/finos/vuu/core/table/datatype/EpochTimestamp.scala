package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.Clock

import java.time.{Duration, Instant}
import java.util.concurrent.TimeUnit.MILLISECONDS

object EpochTimestamp {

  def apply(clock: Clock): EpochTimestamp = {
    new EpochTimestamp(MILLISECONDS.toNanos(clock.now()))
  }

  def apply(instant: Instant): EpochTimestamp = {
    new EpochTimestamp(Duration.between(Instant.EPOCH, instant).toNanos)
  }

}

/**
 * A class representing an Instant in time
 * @param nanos the number of nanoseconds since 01/01/1970 00:00:00.000000000 UTC
 */
case class EpochTimestamp(nanos: Long) {

  override def toString: String = nanos.toString

}
