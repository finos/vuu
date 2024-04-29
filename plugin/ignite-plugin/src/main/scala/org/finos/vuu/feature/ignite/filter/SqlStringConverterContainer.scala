package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.util.types.{TypeConverter, TypeConverterContainer, TypeConverterContainerBuilder}

trait SqlStringConverterContainer {
  def toString[T](value: T, dataType: Class[T]): Option[String]
}

private class SqlStringConverterContainerImpl(
                                               private val tcContainer: TypeConverterContainer
                                             ) extends SqlStringConverterContainer {
  override def toString[T](value: T, dataType: Class[T]): Option[String] =
    tcContainer.convert[T, String](value, dataType, classOf[String])
}

object SqlStringConverterContainerBuilder {
  def apply(): SqlStringConverterContainerBuilder =
    new SqlStringConverterContainerBuilder(TypeConverterContainerBuilder().withoutDefaults())
}

case class SqlStringConverterContainerBuilder private (tcContainerBuilder: TypeConverterContainerBuilder) {
  def withToString[T](fromClass: Class[T], converter: T => String): SqlStringConverterContainerBuilder =
    this.copy(tcContainerBuilder.withConverter(TypeConverter[T, String](fromClass, classOf[String], converter)))

  def build(): SqlStringConverterContainer = new SqlStringConverterContainerImpl(tcContainerBuilder.build())
}
