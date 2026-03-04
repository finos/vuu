package org.finos.vuu.core.table.datatype

import java.math.{BigDecimal => JBigDecimal}

sealed trait ScaledDecimal extends Ordered[ScaledDecimal] {
  val scaledValue: Long

  def getScale: Int

  override def toString: String = {
    val s = scaledValue.toString
    val isNegative = s.startsWith("-")
    val absoluteS = if (isNegative) s.substring(1) else s

    val padded = absoluteS.reverse.padTo(getScale + 1, '0').reverse
    val splitAt = padded.length - getScale
    val result = padded.substring(0, splitAt) + "." + padded.substring(splitAt)

    if (isNegative) "-" + result else result
  }

  override def compare(that: ScaledDecimal): Int = {
    val thisScale = this.getScale
    val thatScale = that.getScale

    if (thisScale == thatScale) {
      this.scaledValue.compare(that.scaledValue)
    } else {
      val diff = Math.abs(thisScale - thatScale)
      val multiplier = BigInt(10).pow(diff)

      if (thisScale < thatScale) {
        (BigInt(this.scaledValue) * multiplier).compare(BigInt(that.scaledValue))
      } else {
        BigInt(this.scaledValue).compare(BigInt(that.scaledValue) * multiplier)
      }
    }
  }

}

object ScaledDecimal {
  private case class ScaleMetadata(minValue: JBigDecimal, maxValue: JBigDecimal)
  private val supportedScales = Seq(2, 4, 6, 8)
  private val scaleConfiguration: Map[Int, ScaleMetadata] = supportedScales.map { scale =>
    val multiplier = JBigDecimal.valueOf(10).pow(scale)
    scale -> ScaleMetadata(
      minValue = JBigDecimal.valueOf(Long.MinValue).divide(multiplier),
      maxValue = JBigDecimal.valueOf(Long.MaxValue).divide(multiplier)
    )
  }.toMap

  def apply(value: BigDecimal, scale: Int): ScaledDecimal = apply(value.bigDecimal, scale)

  def apply(value: JBigDecimal, scale: Int): ScaledDecimal = {
    val config = scaleConfiguration.getOrElse(scale,
      throw new IllegalArgumentException(s"Scale $scale is not supported. Use one of $supportedScales."))

    if (value.compareTo(config.maxValue) > 0 || value.compareTo(config.minValue) < 0) {
      throw new IllegalArgumentException(s"Value $value does not fit in ScaledDecimal$scale")
    }

    val internalValue = value.movePointRight(scale).longValue()

    scale match {
      case 2 => ScaledDecimal2(internalValue)
      case 4 => ScaledDecimal4(internalValue)
      case 6 => ScaledDecimal6(internalValue)
      case 8 => ScaledDecimal8(internalValue)
      case _ => throw new IllegalArgumentException(s"Scale $scale not implemented")
    }
  }
}

case class ScaledDecimal2(scaledValue: Long) extends ScaledDecimal { override def getScale: Int = 2 }
case class ScaledDecimal4(scaledValue: Long) extends ScaledDecimal { override def getScale: Int = 4 }
case class ScaledDecimal6(scaledValue: Long) extends ScaledDecimal { override def getScale: Int = 6 }
case class ScaledDecimal8(scaledValue: Long) extends ScaledDecimal { override def getScale: Int = 8 }
