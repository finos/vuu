package org.finos.vuu.core.table.datatype

object Decimal {

  private val POWERS_OF_10: Array[Int] = Array(
    1, 10, 100, 1000, 10_000, 100_000,
    1_000_000, 10_000_000, 100_000_000, 1_000_000_000
  )

  def apply(originalValue: BigDecimal, scale: Int): Decimal = {
    new Decimal((originalValue * POWERS_OF_10(scale)).longValue)
  }

}

/**
 * A class representing a decimal, which has been multiplied by to remove the scale
 * @param value the value post-multiplication
 */
case class Decimal(value: Long) {

}
