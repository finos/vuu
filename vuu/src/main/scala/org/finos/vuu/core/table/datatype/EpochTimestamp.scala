package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.Clock

import java.time.{Duration, Instant}
import java.util.concurrent.TimeUnit.MILLISECONDS

object EpochTimestamp {

  def apply(clock: Clock): EpochTimestamp = {
    EpochTimestamp(MILLISECONDS.toNanos(clock.now()))
  }

  def apply(instant: Instant): EpochTimestamp = {
    EpochTimestamp(Duration.between(Instant.EPOCH, instant).toNanos)
  }

}

/**
 * A class representing an Instant in time
 * @param nanos the number of nanoseconds since Jan 1st 1970 00:00:00 UTC
 */
case class EpochTimestamp(nanos: Long) extends Ordered[EpochTimestamp] {

  override def toString: String = nanos.toString

  override def compare(that: EpochTimestamp): Int =  {
    if (this.nanos == that.nanos) 0 else if (this.nanos > that.nanos) 1 else -1
  }
}
