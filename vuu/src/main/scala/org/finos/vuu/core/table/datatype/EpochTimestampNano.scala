package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.Clock

import java.time.{Duration, Instant, ZonedDateTime}

object EpochTimestampNano {

  private val NANOS_IN_A_SECOND: Long = Duration.ofSeconds(1).toNanos
  private val NANOS_IN_A_MILLI: Long = Duration.ofMillis(1).toNanos

  def apply(): EpochTimestampNano = {
    EpochTimestampNano(Instant.now())
  }

  def apply(clock: Clock): EpochTimestampNano = {
    val nanos = clock.now() * NANOS_IN_A_MILLI
    EpochTimestampNano(nanos)
  }

  def apply(instant: Instant): EpochTimestampNano = {
    val nanos = (instant.getEpochSecond * NANOS_IN_A_SECOND) + instant.getNano
    EpochTimestampNano(nanos)
  }

  def apply(zdt: ZonedDateTime): EpochTimestampNano = {
    val nanos = (zdt.toEpochSecond * NANOS_IN_A_SECOND) + zdt.getNano
    EpochTimestampNano(nanos)
  }

}

/**
 * A class representing an Instant in time
 * @param nanos the number of nanoseconds since Jan 1st 1970 00:00:00 UTC
 */
case class EpochTimestampNano(nanos: Long) extends Ordered[EpochTimestampNano] {

  override def toString: String = nanos.toString

  override def compare(that: EpochTimestampNano): Int =  {
    java.lang.Long.compare(nanos, that.nanos)
  }
}
