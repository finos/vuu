package org.finos.vuu.util.schema.typeConversion

import scala.util.Try

trait TypeConverterContainer {
  def convert[From, To](value: From, fromClass: Class[From], toClass: Class[To]): Option[To]
  def typeConverter[From, To](fromClass: Class[From], toClass: Class[To]): Option[TypeConverter[From, To]]
}

private case class TypeConverterContainerImpl(
                                               private val converters: List[TypeConverter[_, _]]
                                             ) extends TypeConverterContainer {
  private val typeConverterByName: Map[String, TypeConverter[_, _]] = converters.map(tc => (tc.name, tc)).toMap

  override def convert[From, To](value: From, fromClass: Class[From], toClass: Class[To]): Option[To] = {
    if (TypeUtils.areTypesEqual(fromClass, toClass)) {
      return Some(value.asInstanceOf[To])
    }
    typeConverter[From, To](fromClass, toClass).flatMap(tc => Try(tc.convert(value)).toOption)
  }

  override def typeConverter[From, To](fromClass: Class[From], toClass: Class[To]): Option[TypeConverter[From, To]] = {
    val name = TypeConverter.buildConverterName(fromClass, toClass)
    typeConverter[From, To](name)
  }

  private def typeConverter[From, To](name: String): Option[TypeConverter[From, To]] = {
    typeConverterByName.get(name).flatMap(tc => Try(tc.asInstanceOf[TypeConverter[From, To]]).toOption)
  }
}

object TypeConverterContainerBuilder {
  def apply(): TypeConverterContainerBuilder = new TypeConverterContainerBuilder(List.empty, withDefaults = true)
}

case class TypeConverterContainerBuilder private (private val converters: List[TypeConverter[_, _]],
                                                  private val withDefaults: Boolean) {
  def withConverter[From, To](t: TypeConverter[From, To]): TypeConverterContainerBuilder = {
    this.copy(converters = converters ++ List(t))
  }

  def withoutDefaults(): TypeConverterContainerBuilder = this.copy(withDefaults = false)

  def build(): TypeConverterContainer = {
    val tcs = converters ++ (if (withDefaults) DefaultTypeConverters.getAll else List.empty)
    TypeConverterContainerImpl(converters = tcs.distinctBy(_.name))
  }
}