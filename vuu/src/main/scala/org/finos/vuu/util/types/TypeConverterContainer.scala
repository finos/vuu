package org.finos.vuu.util.types

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
    typeConverter[From, To](fromClass, toClass).map(tc => tc.convert(value))
  }

  override def typeConverter[From, To](fromClass: Class[From], toClass: Class[To]): Option[TypeConverter[From, To]] = {
    val name = TypeConverter.buildConverterName(fromClass, toClass)
    typeConverter[From, To](name)
  }

  private def typeConverter[From, To](name: String): Option[TypeConverter[From, To]] = {
    typeConverterByName.get(name).map(tc => tc.asInstanceOf[TypeConverter[From, To]])
  }
}

object TypeConverterContainerBuilder {
  def apply(): TypeConverterContainerBuilder = new TypeConverterContainerBuilder(List.empty, withDefaults = true)
}

case class TypeConverterContainerBuilder (converters: List[TypeConverter[_, _]], withDefaults: Boolean) {
  def withConverter[From, To](t: TypeConverter[From, To]): TypeConverterContainerBuilder = {
    this.copy(converters = converters ++ List(t))
  }

  def with2WayConverter[T1, T2](cls1: Class[T1],
                                cls2: Class[T2],
                                converter1: T1 => T2,
                                converter2: T2 => T1): TypeConverterContainerBuilder = {
    val tc1 = TypeConverter(cls1, cls2, converter1)
    val tc2 = TypeConverter(cls2, cls1, converter2)
    this.copy(converters = converters ++ List(tc1, tc2))
  }

  def withoutDefaults(): TypeConverterContainerBuilder = this.copy(withDefaults = false)

  def build(): TypeConverterContainer = {
    val tcs = converters ++ (if (withDefaults) DefaultTypeConverters.getAll else List.empty)
    TypeConverterContainerImpl(converters = tcs.distinctBy(_.name))
  }
}