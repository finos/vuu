package org.finos.vuu.core.table.datatype

/**
 * A class representing an Instant in time
 * @param nanos the number of nanoseconds since Jan 1st 1970 00:00:00 UTC
 */
case class EpochTimestamp(nanos: Long) {

  def getNanos: Long = nanos

}
