package org.finos.vuu.core.table.datatype

import java.math.BigDecimal as JBigDecimal

/**
 * Defines the supported fixed-point scales for [[ScaledDecimal]].
 * * Each scale represents the number of digits to the right of the decimal point
 * that are preserved when converting to a long-based representation.
 * * @param precision The number of decimal places (e.g., 2 for Scale.Two).
 */
enum Scale(val precision: Int) {
  case Two extends Scale(2)
  case Four extends Scale(4)
  case Six extends Scale(6)
  case Eight extends Scale(8)

  /**
   * Creates a [[ScaledDecimal]] instance by shifting the decimal point of the
   * input value and truncating to a Long.
   * * @param value The Java BigDecimal to convert.
   * @return A specialized ScaledDecimal implementation (e.g., [[ScaledDecimal2]]).
   */
  def create(value: JBigDecimal): ScaledDecimal = this match
    case Two => ScaledDecimal2(value.movePointRight(precision).longValue())
    case Four => ScaledDecimal4(value.movePointRight(precision).longValue())
    case Six => ScaledDecimal6(value.movePointRight(precision).longValue())
    case Eight => ScaledDecimal8(value.movePointRight(precision).longValue())
}

/**
 * Static constants for [[Scale]] to provide idiomatic access for Java callers.
 */
object Scale {
  val TWO: Scale = Scale.Two
  val FOUR: Scale = Scale.Four
  val SIX: Scale = Scale.Six
  val EIGHT: Scale = Scale.Eight
}

/**
 * Represents a decimal value stored as a scaled `Long` to avoid the overhead
 * of [[java.math.BigDecimal]] in high-throughput scenarios.
 */
sealed trait ScaledDecimal {
  /** The raw long value representing the decimal (e.g., 1.23 with Scale.Two is 123). */
  val scaledValue: Long
  override def toString: String = scaledValue.toString
}

/**
 * Factory object for creating [[ScaledDecimal]] instances.
 */
object ScaledDecimal {

  /**
   * Creates a ScaledDecimal from a Scala BigDecimal.
   * @param value The value to scale.
   * @param scale The target precision.
   */
  def apply(value: BigDecimal, scale: Scale): ScaledDecimal = scale.create(value.underlying())

  /**
   * Creates a ScaledDecimal from a Java BigDecimal.
   * @param value The value to scale.
   * @param scale The target precision.
   */
  def apply(value: JBigDecimal, scale: Scale): ScaledDecimal = scale.create(value)
}

/**
 * A [[ScaledDecimal]] with a fixed scale of 2.
 */
case class ScaledDecimal2(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal2] {
  override def compare(that: ScaledDecimal2): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

/**
 * A [[ScaledDecimal]] with a fixed scale of 4.
 */
case class ScaledDecimal4(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal4] {
  override def compare(that: ScaledDecimal4): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

/**
 * A [[ScaledDecimal]] with a fixed scale of 6.
 */
case class ScaledDecimal6(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal6] {
  override def compare(that: ScaledDecimal6): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}

/**
 * A [[ScaledDecimal]] with a fixed scale of 8.
 */
case class ScaledDecimal8(scaledValue: Long) extends ScaledDecimal with Ordered[ScaledDecimal8] {
  override def compare(that: ScaledDecimal8): Int = {
    java.lang.Long.compare(scaledValue, that.scaledValue)
  }
}