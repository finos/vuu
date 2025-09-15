package org.finos.vuu.core.table.datatype

object Decimal {

  private final val PRECISION = 8
  private final val MULTIPLIER = BigDecimal(10).pow(PRECISION).setScale(PRECISION)
  final val MaxValue: BigDecimal = Long.MaxValue / MULTIPLIER
  final val MinValue: BigDecimal = Long.MinValue / MULTIPLIER

  def apply(originalValue: Double): Decimal = {
    if (originalValue > MaxValue || originalValue < MinValue) {
      throw new IllegalArgumentException(s"$originalValue does not fit inside Decimal")
    } else {
      Decimal((originalValue * MULTIPLIER).longValue)
    }
  }

  def apply(originalValue: BigDecimal): Decimal = {
    if (originalValue.compareTo(MaxValue) > 0 || originalValue.compareTo(MinValue) < 0) {
      throw new IllegalArgumentException(s"$originalValue does not fit inside Decimal")
    } else {
      Decimal((originalValue * MULTIPLIER).longValue)
    }
  }

}

/**
 * A class representing a decimal, which has been multiplied to remove the decimal places.
 *
 * @param value the value post-multiplication
 */
case class Decimal(value: Long) extends Ordered[Decimal] {

  override def toString: String = value.toString

  override def compare(that: Decimal): Int =  {
    if (this.value == that.value) 0 else if (this.value > that.value) 1 else -1
  }
}
