package org.finos.vuu.util.types

import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}

import java.lang._

object DefaultTypeConverters {
  val stringToDoubleConverter: TypeConverter[String, Double] = TypeConverter(classOf[String], classOf[Double], withNullSafety[String, Double](_, _.toDouble))
  val stringToLongConverter: TypeConverter[String, Long] = TypeConverter[String, Long](classOf[String], classOf[Long], withNullSafety[String, Long](_, _.toLong))
  val stringToIntConverter: TypeConverter[String, Integer] = TypeConverter(classOf[String], classOf[Integer], withNullSafety[String, Integer](_, _.toInt))
  val stringToCharConverter: TypeConverter[String, Character] = TypeConverter(classOf[String], classOf[Character], withNullSafety[String, Character](_, _.toCharArray.apply(0)))
  val stringToBooleanConverter: TypeConverter[String, Boolean] = TypeConverter(classOf[String], classOf[Boolean], withNullSafety[String, Boolean](_, _.toBoolean))
  val stringToEpochTimestampConverter: TypeConverter[String, EpochTimestamp] = TypeConverter(classOf[String], classOf[EpochTimestamp], withNullSafety[String, EpochTimestamp](_, f => EpochTimestamp(f.toLong)))
  val stringToDecimalConverter: TypeConverter[String, Decimal] = TypeConverter(classOf[String], classOf[Decimal], withNullSafety[String, Decimal](_, f => Decimal(f.toLong)))


  val intToStringConverter: TypeConverter[Integer, String] = TypeConverter(classOf[Integer], classOf[String], withNullSafety[Integer, String](_, _.toString))
  val intToLongConverter: TypeConverter[Integer, Long] = TypeConverter(classOf[Integer], classOf[Long], withNullSafety[Integer, Long](_, _.toLong))
  val intToDoubleConverter: TypeConverter[Integer, Double] = TypeConverter(classOf[Integer], classOf[Double], withNullSafety[Integer, Double](_, _.doubleValue()))

  val longToStringConverter: TypeConverter[Long, String] = TypeConverter(classOf[Long], classOf[String], withNullSafety[Long, String](_, _.toString))
  val longToIntConverter: TypeConverter[Long, Integer] = TypeConverter(classOf[Long], classOf[Integer], withNullSafety[Long, Integer](_, _.toInt))
  val longToDoubleConverter: TypeConverter[Long, Double] = TypeConverter(classOf[Long], classOf[Double], withNullSafety[Long, Double](_, _.doubleValue()))

  val doubleToStringConverter: TypeConverter[Double, String] = TypeConverter(classOf[Double], classOf[String], withNullSafety[Double, String](_, _.toString))
  val doubleToIntConverter: TypeConverter[Double, Integer] = TypeConverter(classOf[Double], classOf[Integer], withNullSafety[Double, Integer](_, _.toInt))
  val doubleToLongConverter: TypeConverter[Double, Long] = TypeConverter(classOf[Double], classOf[Long], withNullSafety[Double, Long](_, _.toLong))

  val booleanToStringConverter: TypeConverter[Boolean, String] = TypeConverter(classOf[Boolean], classOf[String], withNullSafety[Boolean, String](_, _.toString))

  val charToStringConverter: TypeConverter[Character, String] = TypeConverter(classOf[Character], classOf[String], withNullSafety[Character, String](_, _.toString))


  private def withNullSafety[T1, T2 >: Null](v: T1, fn: T1 => T2): T2 = Option(v).map(fn).orNull

  def getAll: List[TypeConverter[_, _]] = List(
    stringToDoubleConverter,
    stringToLongConverter,
    stringToIntConverter,
    stringToCharConverter,
    stringToBooleanConverter,
    intToStringConverter,
    intToLongConverter,
    intToDoubleConverter,
    longToStringConverter,
    longToIntConverter,
    longToDoubleConverter,
    doubleToStringConverter,
    doubleToIntConverter,
    doubleToLongConverter,
    booleanToStringConverter,
    charToStringConverter,
  )


}
