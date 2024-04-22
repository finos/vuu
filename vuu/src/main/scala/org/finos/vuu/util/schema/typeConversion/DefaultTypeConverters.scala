package org.finos.vuu.util.schema.typeConversion

import java.lang._

object DefaultTypeConverters {
  val stringToDoubleConverter: TypeConverter[String, Double] = TypeConverter(classOf[String], classOf[Double], withNullSafety[String, Double](_, _.toDouble))
  val stringToLongConverter: TypeConverter[String, Long] = TypeConverter[String, Long](classOf[String], classOf[Long], withNullSafety[String, Long](_, _.toLong))
  val stringToIntConverter: TypeConverter[String, Integer] = TypeConverter(classOf[String], classOf[Integer], withNullSafety[String, Integer](_, _.toInt))
  val intToStringConverter: TypeConverter[Integer, String] = TypeConverter(classOf[Integer], classOf[String], withNullSafety[Integer, String](_, _.toString))
  val longToStringConverter: TypeConverter[Long, String] = TypeConverter(classOf[Long], classOf[String], withNullSafety[Long, String](_, _.toString))
  val doubleToStringConverter: TypeConverter[Double, String] = TypeConverter(classOf[Double], classOf[String], withNullSafety[Double, String](_, _.toString))


  private def withNullSafety[T1, T2 >: Null](v: T1, fn: T1 => T2): T2 = Option(v).map(fn).orNull

  def getAll: List[TypeConverter[_, _]] = List(
    stringToDoubleConverter,
    doubleToStringConverter,
    stringToLongConverter,
    longToStringConverter,
    stringToIntConverter,
    intToStringConverter,
  )
}
