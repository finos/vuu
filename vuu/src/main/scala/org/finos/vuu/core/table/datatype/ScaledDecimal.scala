package org.finos.vuu.core.table.datatype

import org.finos.toolbox.number.BigDecimalToScaledLongConverter

import java.math.BigDecimal as JBigDecimal

sealed trait ScaledDecimal {
  val scaledValue: Long
  def getScale: Int
  override def toString: String = scaledValue.toString
}

object ScaledDecimal {

  def apply(value: BigDecimal, scale: Int): ScaledDecimal = apply(value.bigDecimal, scale)

  def apply(value: JBigDecimal, scale: Int): ScaledDecimal = {
    val internalValue = BigDecimalToScaledLongConverter.toScaledLong(value, scale)

    scale match {
      case 2 => ScaledDecimal2(internalValue)
      case 4 => ScaledDecimal4(internalValue)
      case 6 => ScaledDecimal6(internalValue)
      case 8 => ScaledDecimal8(internalValue)
      case _ => throw new IllegalArgumentException(s"Scale $scale not implemented")
    }
  }
}

case class ScaledDecimal2(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal2] {
  override def getScale: Int = 2
  override def compare(that: ScaledDecimal2): Int = {
    if (this.scaledValue == that.scaledValue) 0 else if (this.scaledValue > that.scaledValue) 1 else -1
  }
}

case class ScaledDecimal4(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal4] {
  override def getScale: Int = 4
  override def compare(that: ScaledDecimal4): Int = {
    if (this.scaledValue == that.scaledValue) 0 else if (this.scaledValue > that.scaledValue) 1 else -1
  }
}

case class ScaledDecimal6(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal6] {
  override def getScale: Int = 6
  override def compare(that: ScaledDecimal6): Int = {
    if (this.scaledValue == that.scaledValue) 0 else if (this.scaledValue > that.scaledValue) 1 else -1
  }
}

case class ScaledDecimal8(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal8] {
  override def getScale: Int = 8
  override def compare(that: ScaledDecimal8): Int = {
    if (this.scaledValue == that.scaledValue) 0 else if (this.scaledValue > that.scaledValue) 1 else -1
  }
}
