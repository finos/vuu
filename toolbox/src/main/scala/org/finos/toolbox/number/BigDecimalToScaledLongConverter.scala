package org.finos.toolbox.number

import scala.math.BigDecimal
import java.math.{BigInteger, RoundingMode, BigDecimal as JBigDecimal}

object BigDecimalToScaledLongConverter {

  private val powersOfTen = Array.tabulate(19)(i => BigInt(10).pow(i).toLong)

  def toScaledLong(bd: BigDecimal, shiftLeft: Int): Long = {
    toScaledLong(bd.underlying(), shiftLeft)
  }

  def toScaledLong(bd: JBigDecimal, shiftLeft: Int): Long = {
    if (bd.signum() == 0) return 0L

    val unscaledBI: BigInteger = bd.unscaledValue()
    if (unscaledBI.bitLength() > 63) {
      throw new ArithmeticException(s"Unscaled value too large for Long: $bd")
    }

    val unscaledLong = unscaledBI.longValue()
    val netShift = shiftLeft - bd.scale()

    if (netShift == 0) {
      //No scaling required
      unscaledLong
    } else if (netShift > 0) {
      // Upscaling
      if (netShift < powersOfTen.length) {
        Math.multiplyExact(unscaledLong, powersOfTen(netShift))
      } else {
        throw new ArithmeticException("long overflow");
      }
    } else {
      // Downscaling
      val absShift = Math.abs(netShift)
      if (absShift < powersOfTen.length) {
        unscaledLong / powersOfTen(absShift)
      } else {
        0L
      }
    }
  }

}