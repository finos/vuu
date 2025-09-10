package org.finos.vuu.core.table.datatype

object Decimal {

  private final val PRECISION = 8
  private final val MULTIPLIER = BigDecimal(10).pow(PRECISION).setScale(PRECISION)
  final val MAX_VALUE: BigDecimal = Long.MaxValue / MULTIPLIER
  final val MIN_VALUE: BigDecimal = Long.MinValue / MULTIPLIER

  def apply(originalValue: BigDecimal): Decimal = {
    if (originalValue.compareTo(MAX_VALUE) > 0 || originalValue.compareTo(MIN_VALUE) < 0) {
      throw new IllegalArgumentException(s"$originalValue does not fit inside Decimal")
    } else {
      new Decimal((originalValue * MULTIPLIER).longValue)
    }
  }

}

/**
 * A class representing a decimal, which has been multiplied to remove the decimal places.
 *
 * @param value the value post-multiplication
 */
case class Decimal(value: Long) {


}
