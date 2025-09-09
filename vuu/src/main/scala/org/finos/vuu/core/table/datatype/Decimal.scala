package org.finos.vuu.core.table.datatype

object Decimal {

  private val MULTIPLIER = 100_000_000L

  def apply(originalValue: BigDecimal): Decimal = {
    new Decimal((originalValue * MULTIPLIER).longValue)
  }

  def apply(originalValue: Double): Decimal = {
    new Decimal((originalValue * MULTIPLIER).longValue)
  }

}

/**
 * A class representing a decimal, which has been multiplied by 100_000_000L to remove the scale
 * @param value the value post-multiplication
 */
case class Decimal(value: Long) {

}
