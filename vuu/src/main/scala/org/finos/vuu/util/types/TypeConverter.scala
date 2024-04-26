package org.finos.vuu.util.types

import TypeConverter.buildConverterName
import TypeUtils.toWrapperType

trait TypeConverter[From, To] {
  val fromClass: Class[From]
  val toClass: Class[To]
  def convert(v: From): To
  final def name: String = buildConverterName(fromClass, toClass)
  override final def toString: String = s"[${this.name}]@${this.hashCode()}"
}

object TypeConverter {
  def apply[From, To](fromClass: Class[From], toClass: Class[To], converter: From => To): TypeConverter[From, To] =
    new TypeConverterImpl(fromClass, toClass, converter)

  def buildConverterName(fromClass: Class[_], toClass: Class[_]): String = {
    s"${toWrapperType(fromClass).getTypeName}->${toWrapperType(toClass).getTypeName}"
  }
}

private class TypeConverterImpl[From, To](override val fromClass: Class[From],
                                          override val toClass: Class[To],
                                          converter: From => To) extends TypeConverter[From, To] {
  override def convert(v: From): To = converter(v)
}

