package org.finos.vuu.core.table.datatype

import org.finos.vuu.core.table.datatype.Decimal.scale

object Decimal {

  val scale: Int = 6

  def apply(unscaledValue: BigDecimal): Decimal = new Decimal((unscaledValue * scale).longValue)
}

/**
 * A class representing a decimal, which has been multiplied by 10&#94;scale
 * @param scaledValue the value post-multiplication
 */
case class Decimal (scaledValue: Long) {

  def getScaledValue: Long = scaledValue

  def getUnscaledValue: BigDecimal = scaledValue / scale

}
