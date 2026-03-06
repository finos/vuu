package org.finos.vuu.core.table.datatype

import java.math.BigDecimal as JBigDecimal

enum Scale(val precision: Int) {
  case Two extends Scale(2)
  case Four extends Scale(4)
  case Six extends Scale(6)
  case Eight extends Scale(8)

  def create(value: JBigDecimal): ScaledDecimal = this match
    case Two => ScaledDecimal2(value.movePointRight(precision).longValue())
    case Four => ScaledDecimal4(value.movePointRight(precision).longValue())
    case Six => ScaledDecimal6(value.movePointRight(precision).longValue())
    case Eight => ScaledDecimal8(value.movePointRight(precision).longValue())
}

object Scale { //For Java
  val TWO: Scale = Scale.Two
  val FOUR: Scale = Scale.Four
  val SIX: Scale = Scale.Six
  val EIGHT: Scale = Scale.Eight
}

sealed trait ScaledDecimal {
  val scaledValue: Long
  override def toString: String = scaledValue.toString
}

object ScaledDecimal {

  def apply(value: BigDecimal, scale: Scale): ScaledDecimal = apply(value.bigDecimal, scale)

  def apply(value: JBigDecimal, scale: Scale): ScaledDecimal = scale.create(value)

}

case class ScaledDecimal2(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal2] {
  override def compare(that: ScaledDecimal2): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

case class ScaledDecimal4(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal4] {
  override def compare(that: ScaledDecimal4): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

case class ScaledDecimal6(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal6] {
  override def compare(that: ScaledDecimal6): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

case class ScaledDecimal8(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal8] {
  override def compare(that: ScaledDecimal8): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

