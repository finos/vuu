package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.Clock

import java.time.Instant

object EpochTimestamp {

  def apply(): EpochTimestamp = {
    EpochTimestamp(System.currentTimeMillis())
  }
  
  def apply(clock: Clock): EpochTimestamp = {
    EpochTimestamp(clock.now())
  }

  def apply(instant: Instant): EpochTimestamp = {
    EpochTimestamp(instant.toEpochMilli)
  }

}

/**
 * A class representing an Instant in time
 * @param millis the number of milliseconds since Jan 1st 1970 00:00:00 UTC
 */
case class EpochTimestamp(millis: Long) extends Ordered[EpochTimestamp] {

  override def toString: String = millis.toString

  override def compare(that: EpochTimestamp): Int =  {
    if (this.millis == that.millis) 0 else if (this.millis > that.millis) 1 else -1
  }
}
